import { db } from "../../db";
import {
  bookings,
  appointmentTypes,
  resources,
  appointmentTypeResources,
  bookingAnswers,
  questions,
  payments,
  users,
} from "../../db/schema";
import { eq, and, or, lte, gte, sql, inArray } from "drizzle-orm";
import { CreateBookingDTO, BookingStatus } from "./booking.types";

// Helper type for transaction
type Tx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export class BookingRepository {
  async createBooking(data: any, tx: Tx = db) {
    const [booking] = await tx.insert(bookings).values(data).returning();
    return booking;
  }

  async getBookingsByEmail(email: string) {
    return await db.query.bookings.findMany({
      where: eq(bookings.customerEmail, email),
      with: {
        appointmentType: true,
        resource: true,
      },
    });
  }

  async getBookingById(id: string) {
    return await db.query.bookings.findFirst({
      where: eq(bookings.id, id),
      with: {
        appointmentType: true,
        resource: true,
        payments: true,
      },
    });
  }

  async updateBookingStatus(id: string, status: string, tx: Tx = db) {
    const [booking] = await tx
      .update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async updateBooking(id: string, data: any, tx: Tx = db) {
    const [booking] = await tx
      .update(bookings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async assignResource(
    id: string,
    resourceId: string,
    status: string = BookingStatus.CONFIRMED,
    tx: Tx = db
  ) {
    const [booking] = await tx
      .update(bookings)
      .set({ resourceId, status, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async getAppointmentType(id: string) {
    const [apptType] = await db
      .select()
      .from(appointmentTypes)
      .where(eq(appointmentTypes.id, id));
    return apptType;
  }

  async getResource(id: string) {
    const [resource] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, id));
    return resource;
  }

  async findOverlappingBookings(
    resourceId: string,
    startTime: Date,
    endTime: Date
  ) {
    return await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.resourceId, resourceId),
          eq(bookings.status, BookingStatus.CONFIRMED),
          or(
            and(
              lte(bookings.startTime, startTime),
              gte(bookings.endTime, startTime)
            ), // Starts during existing
            and(
              lte(bookings.startTime, endTime),
              gte(bookings.endTime, endTime)
            ), // Ends during existing
            and(
              gte(bookings.startTime, startTime),
              lte(bookings.endTime, endTime)
            ) // Enclosed by existing
          )
        )
      );
  }

  async findUserOverlappingBooking(
    email: string,
    startTime: Date,
    endTime: Date
  ) {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.customerEmail, email),
          or(
            eq(bookings.status, BookingStatus.CONFIRMED),
            eq(bookings.status, BookingStatus.PENDING)
          ),
          // Overlap logic
          or(
            and(
              lte(bookings.startTime, startTime),
              gte(bookings.endTime, startTime)
            ),
            and(
              lte(bookings.startTime, endTime),
              gte(bookings.endTime, endTime)
            ),
            and(
              gte(bookings.startTime, startTime),
              lte(bookings.endTime, endTime)
            )
          )
        )
      )
      .limit(1);
    return booking;
  }

  async getBookingCount(
    appointmentTypeId: string,
    startTime: Date,
    endTime: Date
  ) {
    // Import lt and gt for proper overlap detection
    const { lt, gt } = await import("drizzle-orm");

    const result = await db
      .select({
        totalPeople: sql<number>`COALESCE(SUM(${bookings.numPeople}), 0)::int`,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.appointmentTypeId, appointmentTypeId),
          // Overlap logic: booking overlaps if startTime < endTime AND endTime > startTime
          lt(bookings.startTime, endTime),
          gt(bookings.endTime, startTime),
          // Check all active statuses
          or(
            eq(bookings.status, "request"),
            eq(bookings.status, "booked"),
            eq(bookings.status, "pending"),
            eq(bookings.status, "confirmed")
          )
        )
      );
    return Number(result[0]?.totalPeople || 0);
  }

  async getAvailableResources(
    appointmentTypeId: string,
    startTime: Date,
    endTime: Date
  ) {
    // 1. Get all resources linked to this appointment type
    const linkedResources = await db
      .select({
        resourceId: appointmentTypeResources.resourceId,
        capacity: resources.capacity,
      })
      .from(appointmentTypeResources)
      .innerJoin(
        resources,
        eq(appointmentTypeResources.resourceId, resources.id)
      )
      .where(eq(appointmentTypeResources.appointmentTypeId, appointmentTypeId));

    if (linkedResources.length === 0) return [];

    const resourceIds = linkedResources.map((r) => r.resourceId);

    // 2. Find bookings that overlap with the requested time for these resources
    const overlappingBookings = await db
      .select({
        resourceId: bookings.resourceId,
        count: sql`count(*)`,
      })
      .from(bookings)
      .where(
        and(
          inArray(bookings.resourceId, resourceIds),
          eq(bookings.status, BookingStatus.CONFIRMED),
          // Overlap logic
          lte(bookings.startTime, endTime),
          gte(bookings.endTime, startTime)
        )
      )
      .groupBy(bookings.resourceId);

    // Map overlap counts
    const overlapMap = new Map<string, number>();
    overlappingBookings.forEach((ob) => {
      if (ob.resourceId) overlapMap.set(ob.resourceId, Number(ob.count));
    });

    // 3. Filter resources that have capacity
    const availableResources = linkedResources.filter((r) => {
      const currentBookings = overlapMap.get(r.resourceId) || 0;
      return currentBookings < (r.capacity || 1);
    });

    return availableResources.map((r) => r.resourceId);
  }

  async findBookings(filters: { appointmentTypeId?: string }) {
    const conditions = [];

    if (filters.appointmentTypeId) {
      conditions.push(
        eq(bookings.appointmentTypeId, filters.appointmentTypeId)
      );
    }

    // Default: return all if no filters, or return filtered
    // Sort by start time descending
    return await db
      .select()
      .from(bookings)
      .where(and(...conditions))
      .orderBy(sql`${bookings.startTime} DESC`);
  }

  async createPayment(data: any, tx: Tx = db) {
    const [payment] = await tx.insert(payments).values(data).returning();
    return payment;
  }

  async updatePaymentStatus(id: string, status: string, tx: Tx = db) {
    const [payment] = await tx
      .update(payments)
      .set({ paymentStatus: status, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  async getPaymentByBookingId(bookingId: string) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.bookingId, bookingId));
    return payment;
  }

  /**
   * Find pending bookings that were created before the cutoff time
   * Used for cleaning up abandoned slot holds
   */
  async findExpiredPendingBookings(cutoffTime: Date) {
    return await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.status, 'pending'),
          lte(bookings.createdAt, cutoffTime)
        )
      );
  }

  async getBookingsWithDetails(userId: string, filters: { 
    type?: 'upcoming' | 'past' | 'cancelled';
    role: 'customer' | 'organiser';
  }) {
    // Determine sort relative to now
    const now = new Date();
    
    // Base query
    const query = db.select({
        id: bookings.id,
        customerName: bookings.customerName,
        customerEmail: bookings.customerEmail,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        subject: bookings.subject,
        appointmentTypeTitle: appointmentTypes.title,
        appointmentTypeLocation: appointmentTypes.location,
        appointmentTypeDuration: appointmentTypes.durationMinutes,
        resourceName: resources.name,
        bookingId: bookings.id,
    })
      .from(bookings)
      .innerJoin(appointmentTypes, eq(bookings.appointmentTypeId, appointmentTypes.id))
      .leftJoin(resources, eq(bookings.resourceId, resources.id));
  
    // Role verification/filter conditions
    let conditions = [];
    
    if (filters.role === 'customer') {
        conditions.push(eq(bookings.customerEmail, 
            sql`(SELECT email FROM users WHERE id = ${userId})`
        ));
    } else if (filters.role === 'organiser') {
        conditions.push(eq(appointmentTypes.ownerId, userId));
    }
  
    // Type filter
    if (filters.type === 'upcoming') {
        conditions.push(
            and(
                sql`${bookings.startTime} > ${now}`,
                sql`${bookings.status} != 'cancelled'`
            )
        );
    } else if (filters.type === 'past') {
        conditions.push(
            and(
                sql`${bookings.startTime} <= ${now}`,
                sql`${bookings.status} != 'cancelled'`
            )
        );
    } else if (filters.type === 'cancelled') {
        conditions.push(eq(bookings.status, 'cancelled'));
    }
  
    // Combine all conditions
    if (conditions.length > 0) {
        query.where(and(...conditions));
    }
    
    // Import desc
    const { desc } = await import("drizzle-orm");
    query.orderBy(desc(bookings.createdAt));
  
    const result = await query;
    return result;
  }
}


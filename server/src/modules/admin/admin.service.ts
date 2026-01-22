/**
 * Admin Dashboard Module - Service Layer
 * Handles business logic for admin dashboard statistics and user management
 */

import { eq, and, sql, gte, lt, or, ilike, count } from 'drizzle-orm';
import { db } from '../../db';
import {
    users,
    appointmentTypes,
    bookings,
    User,
} from '../../db/schema';
import { NotFoundError, AuthorizationError } from '../../utils/error';
import {
    DashboardStats,
    UserStats,
    AppointmentStats,
    BookingStats,
    UserListOptions,
    UserSummary,
    PeakHoursData,
    AppointmentListOptions,
    AppointmentSummary,
    BookingListOptions,
    BookingSummary,
} from './admin.types';

// ============================================
// DASHBOARD STATISTICS
// ============================================

/**
 * Get overall dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    // Get user counts by role
    const userCounts = await db
        .select({
            role: users.role,
            count: sql<number>`count(*)::int`,
        })
        .from(users)
        .groupBy(users.role);

    const roleCountMap = userCounts.reduce(
        (acc, item) => {
            acc[item.role] = item.count;
            return acc;
        },
        {} as Record<string, number>
    );

    // Get total appointment types
    const [appointmentCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(appointmentTypes);

    // Get booking counts by status
    const bookingCounts = await db
        .select({
            status: bookings.status,
            count: sql<number>`count(*)::int`,
        })
        .from(bookings)
        .groupBy(bookings.status);

    const bookingStatusMap = bookingCounts.reduce(
        (acc, item) => {
            acc[item.status] = item.count;
            return acc;
        },
        {} as Record<string, number>
    );

    const totalBookings = bookingCounts.reduce((sum, item) => sum + item.count, 0);

    return {
        totalUsers: Object.values(roleCountMap).reduce((sum, count) => sum + count, 0),
        totalCustomers: roleCountMap['customer'] || 0,
        totalOrganisers: roleCountMap['organiser'] || 0,
        totalAdmins: roleCountMap['admin'] || 0,
        totalAppointments: appointmentCount?.count ?? 0,
        totalBookings,
        activeBookings: (bookingStatusMap['request'] || 0) + (bookingStatusMap['booked'] || 0),
        completedBookings: bookingStatusMap['completed'] || 0,
        cancelledBookings: bookingStatusMap['cancelled'] || 0,
        pendingBookings: bookingStatusMap['request'] || 0,
    };
}

/**
 * Get detailed user statistics
 */
export async function getUserStats(): Promise<UserStats> {
    // Get counts by role
    const roleCounts = await db
        .select({
            role: users.role,
            count: sql<number>`count(*)::int`,
        })
        .from(users)
        .groupBy(users.role);

    const roleCountMap = roleCounts.reduce(
        (acc, item) => {
            acc[item.role] = item.count;
            return acc;
        },
        {} as Record<string, number>
    );

    // Get active/inactive counts
    const [activeCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.isActive, true));

    const [inactiveCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.isActive, false));

    // Get verified/unverified counts
    const [verifiedCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.emailVerified, true));

    const [unverifiedCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.emailVerified, false));

    const total = Object.values(roleCountMap).reduce((sum, count) => sum + count, 0);

    return {
        total,
        byRole: {
            customer: roleCountMap['customer'] || 0,
            organiser: roleCountMap['organiser'] || 0,
            admin: roleCountMap['admin'] || 0,
        },
        activeUsers: activeCount?.count ?? 0,
        inactiveUsers: inactiveCount?.count ?? 0,
        verifiedUsers: verifiedCount?.count ?? 0,
        unverifiedUsers: unverifiedCount?.count ?? 0,
    };
}

/**
 * Get appointment statistics
 */
export async function getAppointmentStats(): Promise<AppointmentStats> {
    // Get total count
    const [totalCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(appointmentTypes);

    // Get published count
    const [publishedCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(appointmentTypes)
        .where(eq(appointmentTypes.isPublished, true));

    // Get unpublished count
    const [unpublishedCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(appointmentTypes)
        .where(eq(appointmentTypes.isPublished, false));

    // Get counts by owner (top 10)
    const byOwner = await db
        .select({
            ownerId: appointmentTypes.ownerId,
            ownerName: users.name,
            count: sql<number>`count(*)::int`,
        })
        .from(appointmentTypes)
        .innerJoin(users, eq(appointmentTypes.ownerId, users.id))
        .groupBy(appointmentTypes.ownerId, users.name)
        .orderBy(sql`count(*) DESC`)
        .limit(10);

    return {
        total: totalCount?.count ?? 0,
        published: publishedCount?.count ?? 0,
        unpublished: unpublishedCount?.count ?? 0,
        byOwner,
    };
}

/**
 * Get booking statistics
 */
export async function getBookingStats(): Promise<BookingStats> {
    // Get counts by status
    const statusCounts = await db
        .select({
            status: bookings.status,
            count: sql<number>`count(*)::int`,
        })
        .from(bookings)
        .groupBy(bookings.status);

    const statusMap = statusCounts.reduce(
        (acc, item) => {
            acc[item.status] = item.count;
            return acc;
        },
        {} as Record<string, number>
    );

    const total = statusCounts.reduce((sum, item) => sum + item.count, 0);

    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookings)
        .where(and(gte(bookings.startTime, today), lt(bookings.startTime, tomorrow)));

    // Get upcoming bookings (future)
    const now = new Date();
    const [upcomingCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookings)
        .where(
            and(
                gte(bookings.startTime, now),
                or(eq(bookings.status, 'request'), eq(bookings.status, 'booked'))
            )
        );

    return {
        total,
        byStatus: {
            request: statusMap['request'] || 0,
            booked: statusMap['booked'] || 0,
            cancelled: statusMap['cancelled'] || 0,
            completed: statusMap['completed'] || 0,
        },
        todayBookings: todayCount?.count ?? 0,
        upcomingBookings: upcomingCount?.count ?? 0,
    };
}

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * Get all users with pagination and filtering
 */
export async function getUsers(
    options: UserListOptions
): Promise<{ data: UserSummary[]; total: number }> {
    const { page, limit, role, isActive, search } = options;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: any[] = [];

    if (role) {
        conditions.push(eq(users.role, role));
    }

    if (isActive !== undefined) {
        conditions.push(eq(users.isActive, isActive));
    }

    if (search) {
        conditions.push(
            or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))
        );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(whereClause);

    // Get paginated results with appointment and booking counts
    const results = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            isActive: users.isActive,
            emailVerified: users.emailVerified,
            createdAt: users.createdAt,
        })
        .from(users)
        .where(whereClause)
        .orderBy(users.createdAt)
        .limit(limit)
        .offset(offset);

    // Enrich with counts
    const enrichedResults: UserSummary[] = await Promise.all(
        results.map(async (user) => {
            // Get appointment count for organisers
            let appointmentsCount = 0;
            if (user.role === 'organiser' || user.role === 'admin') {
                const [apptCount] = await db
                    .select({ count: sql<number>`count(*)::int` })
                    .from(appointmentTypes)
                    .where(eq(appointmentTypes.ownerId, user.id));
                appointmentsCount = apptCount?.count ?? 0;
            }

            // Get booking count (as customer)
            const [bookingCount] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(bookings)
                .where(eq(bookings.customerEmail, user.email));

            return {
                ...user,
                isActive: user.isActive ?? true,
                emailVerified: user.emailVerified ?? false,
                appointmentsCount,
                bookingsCount: bookingCount?.count ?? 0,
            };
        })
    );

    return { data: enrichedResults, total: countResult?.count ?? 0 };
}

/**
 * Get a single user by ID
 */
export async function getUserById(id: string): Promise<User> {
    const user = await db.query.users.findFirst({
        where: eq(users.id, id),
    });

    if (!user) {
        throw new NotFoundError('User');
    }

    return user;
}

/**
 * Update user active status (activate/deactivate)
 */
export async function updateUserStatus(
    id: string,
    isActive: boolean
): Promise<User> {
    // Verify user exists
    await getUserById(id);

    const [updated] = await db
        .update(users)
        .set({
            isActive,
            updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

    if (!updated) {
        throw new NotFoundError('User');
    }

    return updated;
}

/**
 * Update user role
 */
export async function updateUserRole(
    id: string,
    role: 'customer' | 'organiser' | 'admin',
    adminId: string
): Promise<User> {
    // Prevent admin from changing their own role
    if (id === adminId) {
        throw new AuthorizationError('Cannot change your own role');
    }

    // Verify user exists
    await getUserById(id);

    const [updated] = await db
        .update(users)
        .set({
            role,
            updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

    if (!updated) {
        throw new NotFoundError('User');
    }

    return updated;
}

// ============================================
// APPOINTMENT LISTING
// ============================================

/**
 * Get all appointments with pagination and filtering
 */
export async function getAppointments(
    options: AppointmentListOptions
): Promise<{ data: AppointmentSummary[]; total: number }> {
    const { page, limit, isPublished, search } = options;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: any[] = [];

    if (isPublished !== undefined) {
        conditions.push(eq(appointmentTypes.isPublished, isPublished));
    }

    if (search) {
        conditions.push(
            or(
                ilike(appointmentTypes.title, `%${search}%`),
                ilike(appointmentTypes.description, `%${search}%`)
            )
        );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(appointmentTypes)
        .where(whereClause);

    // Get paginated results with owner info
    const results = await db
        .select({
            id: appointmentTypes.id,
            ownerId: appointmentTypes.ownerId,
            title: appointmentTypes.title,
            description: appointmentTypes.description,
            durationMinutes: appointmentTypes.durationMinutes,
            location: appointmentTypes.location,
            isPublished: appointmentTypes.isPublished,
            isPaid: appointmentTypes.isPaid,
            bookingFeeCents: appointmentTypes.bookingFeeCents,
            maxCapacity: appointmentTypes.maxCapacity,
            cancellationHours: appointmentTypes.cancellationHours,
            createdAt: appointmentTypes.createdAt,
            updatedAt: appointmentTypes.updatedAt,
            ownerName: users.name,
            ownerEmail: users.email,
        })
        .from(appointmentTypes)
        .leftJoin(users, eq(appointmentTypes.ownerId, users.id))
        .where(whereClause)
        .orderBy(appointmentTypes.createdAt)
        .limit(limit)
        .offset(offset);

    // Enrich with booking counts
    const enrichedResults: AppointmentSummary[] = await Promise.all(
        results.map(async (apt) => {
            const [bookingCount] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(bookings)
                .where(eq(bookings.appointmentTypeId, apt.id));

            return {
                id: apt.id,
                ownerId: apt.ownerId,
                title: apt.title,
                description: apt.description,
                durationMinutes: apt.durationMinutes,
                location: apt.location,
                isPublished: apt.isPublished ?? false,
                isPaid: apt.isPaid ?? false,
                bookingFeeCents: apt.bookingFeeCents,
                maxCapacity: apt.maxCapacity ?? 1,
                cancellationHours: apt.cancellationHours ?? 1,
                createdAt: apt.createdAt,
                updatedAt: apt.updatedAt,
                owner: apt.ownerName ? {
                    id: apt.ownerId,
                    name: apt.ownerName,
                    email: apt.ownerEmail || '',
                } : undefined,
                bookingsCount: bookingCount?.count ?? 0,
            };
        })
    );

    return { data: enrichedResults, total: countResult?.count ?? 0 };
}

// ============================================
// BOOKING LISTING
// ============================================

/**
 * Get all bookings with pagination and filtering
 */
export async function getBookings(
    options: BookingListOptions
): Promise<{ data: BookingSummary[]; total: number }> {
    const { page, limit, status, search, fromDate, toDate } = options;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: any[] = [];

    if (status) {
        conditions.push(eq(bookings.status, status));
    }

    if (search) {
        conditions.push(
            or(
                ilike(bookings.customerName, `%${search}%`),
                ilike(bookings.customerEmail, `%${search}%`)
            )
        );
    }

    if (fromDate) {
        conditions.push(gte(bookings.startTime, fromDate));
    }

    if (toDate) {
        conditions.push(lt(bookings.startTime, toDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookings)
        .where(whereClause);

    // Get paginated results with appointment info
    const results = await db
        .select({
            id: bookings.id,
            appointmentTypeId: bookings.appointmentTypeId,
            resourceId: bookings.resourceId,
            customerName: bookings.customerName,
            customerEmail: bookings.customerEmail,
            customerPhone: bookings.customerPhone,
            startTime: bookings.startTime,
            endTime: bookings.endTime,
            status: bookings.status,
            numPeople: bookings.numPeople,
            subject: bookings.subject,
            createdAt: bookings.createdAt,
            updatedAt: bookings.updatedAt,
            appointmentTitle: appointmentTypes.title,
            ownerId: appointmentTypes.ownerId,
        })
        .from(bookings)
        .leftJoin(appointmentTypes, eq(bookings.appointmentTypeId, appointmentTypes.id))
        .where(whereClause)
        .orderBy(sql`${bookings.startTime} DESC`)
        .limit(limit)
        .offset(offset);

    // Enrich with owner info
    const enrichedResults: BookingSummary[] = await Promise.all(
        results.map(async (booking) => {
            let owner = undefined;
            if (booking.ownerId) {
                const ownerUser = await db.query.users.findFirst({
                    where: eq(users.id, booking.ownerId),
                    columns: { id: true, name: true, email: true },
                });
                if (ownerUser) {
                    owner = ownerUser;
                }
            }

            return {
                id: booking.id,
                appointmentTypeId: booking.appointmentTypeId,
                resourceId: booking.resourceId,
                customerName: booking.customerName,
                customerEmail: booking.customerEmail,
                customerPhone: booking.customerPhone,
                startTime: booking.startTime,
                endTime: booking.endTime,
                status: booking.status,
                numPeople: booking.numPeople ?? 1,
                subject: booking.subject,
                createdAt: booking.createdAt,
                updatedAt: booking.updatedAt,
                appointmentType: booking.appointmentTitle ? {
                    id: booking.appointmentTypeId,
                    title: booking.appointmentTitle,
                    owner,
                } : undefined,
            };
        })
    );

    return { data: enrichedResults, total: countResult?.count ?? 0 };
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
    id: string,
    status: 'request' | 'booked' | 'cancelled' | 'completed'
): Promise<BookingSummary> {
    // Verify booking exists
    const existingBooking = await db.query.bookings.findFirst({
        where: eq(bookings.id, id),
    });

    if (!existingBooking) {
        throw new NotFoundError('Booking');
    }

    const [updated] = await db
        .update(bookings)
        .set({
            status,
            updatedAt: new Date(),
        })
        .where(eq(bookings.id, id))
        .returning();

    if (!updated) {
        throw new NotFoundError('Booking');
    }

    // Get enriched result
    const { data } = await getBookings({ page: 1, limit: 1 });
    const enrichedBooking = data.find(b => b.id === id);

    return enrichedBooking || {
        ...updated,
        numPeople: updated.numPeople ?? 1,
    };
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Get peak booking hours (last 30 days)
 */
export async function getPeakHours(): Promise<PeakHoursData[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const results = await db
        .select({
            hour: sql<number>`EXTRACT(HOUR FROM ${bookings.startTime})::int`,
            bookingsCount: sql<number>`count(*)::int`,
        })
        .from(bookings)
        .where(gte(bookings.createdAt, thirtyDaysAgo))
        .groupBy(sql`EXTRACT(HOUR FROM ${bookings.startTime})`)
        .orderBy(sql`EXTRACT(HOUR FROM ${bookings.startTime})`);

    return results;
}


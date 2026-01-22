import { db } from "../../db";
import { BookingRepository } from "./booking.repository";
import { CreateBookingDTO, BookingStatus } from "./booking.types";
import { ConflictError } from "../../utils/error";
import { randomUUID } from "crypto";
import { ValidationError, NotFoundError } from "../../utils/error";
import { PaymentService } from "../payments/payment.service";
import { emitSlotUpdate, emitSlotChange } from "../../config/socket";

// Helper to format date for socket events (YYYY-MM-DD)
function formatDateToString(date: Date): string {
  const isoString = date.toISOString();
  return isoString.substring(0, 10); // Returns YYYY-MM-DD
}

export class BookingService {
  private repo: BookingRepository;

  constructor() {
    this.repo = new BookingRepository();
  }

  async createBooking(data: CreateBookingDTO) {
    // Store values needed for socket emission after transaction
    let appointmentTypeId: string;
    let startTime: Date;
    let endTime: Date;
    let maxCapacity: number;

    const booking = await db.transaction(async (tx) => {
      // 1. Validate Appointment Type
      const apptType = await this.repo.getAppointmentType(
        data.appointmentTypeId
      );
      if (!apptType) throw new NotFoundError("Appointment type");
      if (!apptType.isPublished)
        throw new ValidationError("Appointment type is not published");

      startTime = new Date(data.startTime);
      endTime = new Date(data.endTime);
      appointmentTypeId = data.appointmentTypeId;
      maxCapacity = apptType.maxCapacity || 1;

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new ValidationError("Invalid start or end time");
      }

      // 1.5 Check if user already has a booking at this time
      const existingBooking = await this.repo.findUserOverlappingBooking(
        data.customerEmail,
        startTime,
        endTime
      );
      if (existingBooking) {
        throw new ConflictError(
          "You already have a booking for this time slot"
        );
      }

      // 2. Capacity Validation (if managed)
      if (apptType.manageCapacity) {
        const currentCount = await this.repo.getBookingCount(
          apptType.id,
          startTime,
          endTime
        );
        if (currentCount >= (apptType.maxCapacity || 1)) {
          throw new ValidationError(
            "This time slot is fully booked. Please select another time."
          );
        }
      }

      // 3. Assignment Logic and Status Determination
      let resourceId: string | null = null;
      let status: BookingStatus;

      // Debug log to verify manualConfirmation value
      console.log(`[Booking Creation] Appointment Type: ${apptType.title}, manualConfirmation: ${apptType.manualConfirmation}`);

      // Determine status based on manualConfirmation flag
      if (apptType.manualConfirmation) {
        // Manual confirmation required -> status = request
        status = BookingStatus.REQUEST;
        console.log('[Booking Creation] Status set to REQUEST (manual confirmation is ON)');
      } else {
        // Automatic confirmation -> status = booked
        status = BookingStatus.BOOKED;
        console.log('[Booking Creation] Status set to BOOKED (manual confirmation is OFF)');
      }

      // Handle resource assignment
      let assignedResourceName: string | null = null;
      if (apptType.assignmentType === "automatic") {
        const availableResources = await this.repo.getAvailableResources(
          apptType.id,
          startTime,
          endTime
        );
        if (availableResources.length > 0) {
          // Round-robin or random? For now, pick the first one.
          resourceId = availableResources[0] as string;

          // Fetch the resource details to get the name for the subject
          const assignedResource = await this.repo.getResource(resourceId);
          if (assignedResource) {
            assignedResourceName = assignedResource.name;
          }
        } else {
          // If auto-assignment fails (e.g. all resources busy), what to do?
          // If capacity was fine but no resource is free?
          // Since capacity check is separate, this implies resources are the bottleneck.
          throw new Error("No available resources for this slot");
        }
      } else {
        // Manual assignment - resource will be assigned later by organizer
        resourceId = null;
      }

      // 4. Create Booking
      const bookingData = {
        id: randomUUID(),
        appointmentTypeId: data.appointmentTypeId,
        resourceId: resourceId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        startTime: startTime,
        endTime: endTime,
        status: status,
        numPeople: data.numPeople || 1,
        // If subject is provided by user, use it; otherwise use assigned resource name for automatic assignment
        subject: data.subject || assignedResourceName || null,
      };

      const createdBooking = await this.repo.createBooking(bookingData, tx);
      return createdBooking;
    });

    // Emit real-time slot update AFTER transaction commits successfully
    // This ensures the booking is saved before we broadcast the update
    try {
      const dateStr = formatDateToString(startTime!);
      console.log(`📡 Broadcasting slot update for ${appointmentTypeId!} on ${dateStr}`);
      await emitSlotUpdate(appointmentTypeId!, dateStr);

      const currentCount = await this.repo.getBookingCount(appointmentTypeId!, startTime!, endTime!);
      emitSlotChange({
        appointmentTypeId: appointmentTypeId!,
        date: dateStr,
        startTime: startTime!.toISOString(),
        endTime: endTime!.toISOString(),
        remainingCapacity: maxCapacity! - currentCount,
        available: (maxCapacity! - currentCount) > 0,
        action: 'booked',
      });
    } catch (err) {
      console.error('Error emitting slot update:', err);
    }

    return booking;
  }

  async getBooking(id: string) {
    const booking = await this.repo.getBookingById(id);
    if (!booking) throw new Error("Booking not found");
    return booking;
  }

  /**
   * Hold a slot temporarily when user clicks "Continue" from slot selection
   * This creates a pending booking that reserves the slot and broadcasts to other users
   * The hold expires if not converted to a full booking within the timeout
   */
  async holdSlot(data: {
    appointmentTypeId: string;
    customerEmail: string;
    startTime: string;
    endTime: string;
    numPeople?: number;
  }) {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    // Validate appointment type
    const apptType = await this.repo.getAppointmentType(data.appointmentTypeId);
    if (!apptType) throw new NotFoundError("Appointment type");
    if (!apptType.isPublished)
      throw new ValidationError("Appointment type is not published");

    // Check capacity
    if (apptType.manageCapacity) {
      const currentCount = await this.repo.getBookingCount(
        apptType.id,
        startTime,
        endTime
      );
      if (currentCount >= (apptType.maxCapacity || 1)) {
        throw new ValidationError(
          "This time slot is fully booked. Please select another time."
        );
      }
    }

    // Create a PENDING booking to hold the slot
    const holdData = {
      id: randomUUID(),
      appointmentTypeId: data.appointmentTypeId,
      resourceId: null,
      customerName: "Pending", // Will be updated when booking is completed
      customerEmail: data.customerEmail,
      customerPhone: null,
      startTime: startTime,
      endTime: endTime,
      status: BookingStatus.PENDING,
      numPeople: data.numPeople || 1,
      subject: null,
    };

    const hold = await this.repo.createBooking(holdData);

    // Immediately broadcast the slot update to all connected users
    try {
      const dateStr = formatDateToString(startTime);
      console.log(`📡 Broadcasting slot HOLD for ${data.appointmentTypeId} on ${dateStr}`);
      await emitSlotUpdate(data.appointmentTypeId, dateStr);

      const currentCount = await this.repo.getBookingCount(data.appointmentTypeId, startTime, endTime);
      const maxCapacity = apptType.maxCapacity || 1;
      emitSlotChange({
        appointmentTypeId: data.appointmentTypeId,
        date: dateStr,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        remainingCapacity: maxCapacity - currentCount,
        available: (maxCapacity - currentCount) > 0,
        action: 'booked',
      });
    } catch (err) {
      console.error('Error emitting slot hold update:', err);
    }

    return hold;
  }

  /**
   * Release a held slot (when user cancels or navigates away)
   */
  async releaseHold(holdId: string) {
    const hold = await this.repo.getBookingById(holdId);
    if (!hold) return; // Already released or doesn't exist

    if (hold.status !== BookingStatus.PENDING) {
      return; // Not a hold, don't release
    }

    await this.repo.updateBookingStatus(holdId, BookingStatus.CANCELLED);

    // Broadcast the slot becoming available again
    try {
      const dateStr = formatDateToString(hold.startTime);
      console.log(`📡 Broadcasting slot RELEASE for ${hold.appointmentTypeId} on ${dateStr}`);
      await emitSlotUpdate(hold.appointmentTypeId, dateStr);
      emitSlotChange({
        appointmentTypeId: hold.appointmentTypeId,
        date: dateStr,
        startTime: hold.startTime.toISOString(),
        endTime: hold.endTime.toISOString(),
        remainingCapacity: 0, // Will be recalculated
        available: true,
        action: 'cancelled',
      });
    } catch (err) {
      console.error('Error emitting slot release update:', err);
    }
  }

  /**
   * Convert a held slot to a full booking
   */
  async confirmHold(holdId: string, data: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    subject?: string;
  }) {
    const hold = await this.repo.getBookingById(holdId);
    if (!hold) throw new NotFoundError("Booking hold");

    if (hold.status !== BookingStatus.PENDING) {
      throw new ValidationError("This hold has already been processed");
    }

    // Get appointment type to determine status
    const apptType = await this.repo.getAppointmentType(hold.appointmentTypeId);
    if (!apptType) throw new NotFoundError("Appointment type");

    const newStatus = apptType.manualConfirmation ? BookingStatus.REQUEST : BookingStatus.BOOKED;

    // Update the hold to a full booking
    const booking = await this.repo.updateBooking(holdId, {
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone || null,
      subject: data.subject || null,
      status: newStatus,
    });

    return booking;
  }

  async getBookings(userId: string, filters: {
    type?: 'upcoming' | 'past' | 'cancelled';
    role: 'customer' | 'organiser';
  }) {
    const rawBookings = await this.repo.getBookingsWithDetails(userId, filters);

    // Map flat structure to nested object structure expected by frontend
    return rawBookings.map(row => ({
      id: row.id,
      startTime: row.startTime,
      endTime: row.endTime,
      status: row.status,
      subject: row.subject,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      appointmentType: {
        title: row.appointmentTypeTitle,
        location: row.appointmentTypeLocation,
        durationMinutes: row.appointmentTypeDuration
      },
      resource: row.resourceName ? { name: row.resourceName } : null
    }));
  }

  async getUserBookings(email: string) {
    return await this.repo.getBookingsByEmail(email);
  }

  async cancelBooking(id: string) {
    const booking = await this.repo.getBookingById(id);
    if (!booking) throw new Error("Booking not found");
    if (booking.status === BookingStatus.CANCELLED)
      throw new Error("Booking is already cancelled");

    // Check cancellation policy
    const apptType = await this.repo.getAppointmentType(booking.appointmentTypeId);
    if (apptType) {
      const now = new Date();
      const startTime = new Date(booking.startTime);
      const hoursDiff = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (apptType.cancellationHours && apptType.cancellationHours > 0) {
        if (hoursDiff < apptType.cancellationHours) {
          throw new Error(`Cannot cancel less than ${apptType.cancellationHours} hours before appointment`);
        }
      }
    }

    // Check for payment and process refund if applicable
    const payment = await this.repo.getPaymentByBookingId(id);
    if (payment && payment.paymentStatus === "completed") {
      const refundAmount = payment.amountCents * 0.95; // 95% refund
      const paymentService = new PaymentService();

      try {
        await paymentService.refundPayment(
          payment.transactionId!,
          refundAmount / 100
        ); // Service expects amount in currency units
        await this.repo.updatePaymentStatus(payment.id, "refunded");
      } catch (error) {
        console.error("Refund failed during cancellation:", error);
        // We might want to throw here or just log it and proceed with cancellation?
        // For now, let's log and proceed but maybe flag it?
        // Ideally, if refund fails, we should probably stop cancellation or mark as "cancellation_pending_refund".
        // But user requirement says "handle that case", so let's assume we want to try refund.
        // If it fails, we should probably let the user know.
        throw new Error("Failed to process refund. Cancellation aborted.");
      }
    }

    const cancelledBooking = await this.repo.updateBookingStatus(id, BookingStatus.CANCELLED);

    // Emit real-time slot update after cancellation (slot becomes available again)
    setImmediate(async () => {
      try {
        const dateStr = formatDateToString(booking.startTime);
        await emitSlotUpdate(booking.appointmentTypeId, dateStr);
        emitSlotChange({
          appointmentTypeId: booking.appointmentTypeId,
          date: dateStr,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          remainingCapacity: 0, // Will be recalculated by the slot update
          available: true,
          action: 'cancelled',
        });
      } catch (err) {
        console.error('Error emitting slot update after cancellation:', err);
      }
    });

    return cancelledBooking;
  }

  async assignResource(id: string, resourceId: string) {
    return await db.transaction(async (tx) => {
      const booking = await this.repo.getBookingById(id);
      if (!booking) throw new Error("Booking not found");

      if (booking.status !== BookingStatus.PENDING) {
        throw new Error("Booking must be in PENDING state to assign resource");
      }

      const resource = await this.repo.getResource(resourceId);
      if (!resource) throw new Error("Resource not found");

      // Validate overlap for this specific resource
      const overlaps = await this.repo.findOverlappingBookings(
        resourceId,
        booking.startTime,
        booking.endTime
      );

      if (overlaps.length >= (resource.capacity || 1)) {
        throw new Error("Resource is fully booked for this time slot");
      }

      return await this.repo.assignResource(
        id,
        resourceId,
        BookingStatus.CONFIRMED,
        tx
      );
    });
  }

  async confirmBooking(id: string) {
    const booking = await this.repo.getBookingById(id);
    if (!booking) throw new Error("Booking not found");
    if (booking.status !== BookingStatus.PENDING)
      throw new Error("Booking is not pending");

    return await this.repo.updateBookingStatus(id, BookingStatus.CONFIRMED);
  }

  async rescheduleBooking(id: string, newStartTime: Date, explicitEndTime?: Date) {
    return await db.transaction(async (tx) => {
      const booking = await this.repo.getBookingById(id);
      if (!booking) throw new Error("Booking not found");

      if (booking.status === BookingStatus.CANCELLED) {
        throw new Error("Cannot reschedule a cancelled booking");
      }

      // Calculate new end time
      let newEndTime: Date;
      if (explicitEndTime) {
        newEndTime = explicitEndTime;
      } else {
        const duration = booking.endTime.getTime() - booking.startTime.getTime();
        newEndTime = new Date(newStartTime.getTime() + duration);
      }

      // Validate Appointment Type for capacity/availability if needed
      const apptType = await this.repo.getAppointmentType(
        booking.appointmentTypeId
      );
      if (!apptType) throw new Error("Appointment type not found");

      // Check capacity
      if (apptType.manageCapacity) {
        const currentCount = await this.repo.getBookingCount(
          apptType.id,
          newStartTime,
          newEndTime
        );
        if (currentCount >= (apptType.maxCapacity || 1)) {
          throw new Error("Maximum capacity reached for this slot");
        }
      }

      // Reset to PENDING and clear resource
      const updatedBooking = await this.repo.updateBooking(
        id,
        {
          startTime: newStartTime,
          endTime: newEndTime,
          status: BookingStatus.PENDING,
          resourceId: null, // Unassign resource
        },
        tx
      );

      return updatedBooking;
    });
  }

  /**
   * Update booking status (alias for controller use)
   * Emits real-time updates for capacity changes
   */
  async updateStatus(id: string, status: string): Promise<any> {
    return await this.updateBookingStatusWithNotification(id, status as BookingStatus);
  }

  async listBookings(filters: { appointmentTypeId?: string }) {
    return await this.repo.findBookings(filters);
  }

  async createPaymentOrder(bookingId: string) {
    const booking = await this.repo.getBookingById(bookingId);
    if (!booking) throw new Error("Booking not found");

    const apptType = await this.repo.getAppointmentType(
      booking.appointmentTypeId
    );
    if (!apptType) throw new Error("Appointment type not found");

    if (!apptType.isPaid || !apptType.bookingFeeCents) {
      throw new Error("This appointment is free");
    }

    // Create Razorpay order
    // We need to instantiate PaymentService here or inject it.
    // Since we didn't inject it in constructor, let's instantiate it here or add to class.
    // For cleaner code, I'll add it to the class property.
    const paymentService = new PaymentService();
    // Assuming bookingFeeCents stores the amount in main currency units (e.g. INR) per user request/observation
    const order = await paymentService.createOrder(
      apptType.bookingFeeCents,
      "INR",
      booking.id
    );

    return order;
  }

  async confirmPayment(
    bookingId: string,
    paymentDetails: { paymentId: string; orderId: string; signature: string }
  ) {
    return await db.transaction(async (tx) => {
      const booking = await this.repo.getBookingById(bookingId);
      if (!booking) throw new Error("Booking not found");

      const apptType = await this.repo.getAppointmentType(
        booking.appointmentTypeId
      );
      if (!apptType) throw new Error("Appointment type not found");

      // Verify payment signature
      const paymentService = new PaymentService();
      const isValid = paymentService.verifyPayment(
        paymentDetails.orderId,
        paymentDetails.paymentId,
        paymentDetails.signature
      );

      if (!isValid) throw new Error("Invalid payment signature");

      // Create Payment Record
      await this.repo.createPayment(
        {
          id: randomUUID(),
          bookingId: booking.id,
          amountCents: apptType.bookingFeeCents,
          currency: "INR",
          paymentMethod: "razorpay", // or derive from payment details if possible
          paymentStatus: "completed",
          transactionId: paymentDetails.paymentId,
          paidAt: new Date(),
        },
        tx
      );

      // Update Booking Status
      const updatedBooking = await this.repo.updateBookingStatus(
        bookingId,
        BookingStatus.CONFIRMED,
        tx
      );

      return updatedBooking;
    });
  }

  /**
   * Handle payment failure - cancels the booking and releases the slot
   * This is called when payment times out or is explicitly cancelled
   */
  async handlePaymentFailure(bookingId: string): Promise<void> {
    const booking = await this.repo.getBookingById(bookingId);
    if (!booking) throw new Error("Booking not found");

    // Only cancel if booking is not already completed
    if (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.CANCELLED) {
      return; // Already processed
    }

    // Cancel the booking
    await this.repo.updateBookingStatus(bookingId, BookingStatus.CANCELLED);

    // Emit real-time slot update (slot becomes available again)
    setImmediate(async () => {
      try {
        const dateStr = formatDateToString(booking.startTime);
        await emitSlotUpdate(booking.appointmentTypeId, dateStr);
        emitSlotChange({
          appointmentTypeId: booking.appointmentTypeId,
          date: dateStr,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          remainingCapacity: 0, // Will be recalculated
          available: true,
          action: 'payment_failed',
        });
      } catch (err) {
        console.error('Error emitting slot update after payment failure:', err);
      }
    });
  }

  /**
   * Update booking status with real-time notification
   * Used for organizer status changes (request -> booked, etc.)
   */
  async updateBookingStatusWithNotification(bookingId: string, newStatus: BookingStatus): Promise<any> {
    const booking = await this.repo.getBookingById(bookingId);
    if (!booking) throw new Error("Booking not found");

    const updatedBooking = await this.repo.updateBookingStatus(bookingId, newStatus);

    // Emit update for status changes that affect capacity
    if (newStatus === BookingStatus.CANCELLED) {
      setImmediate(async () => {
        try {
          const dateStr = formatDateToString(booking.startTime);
          await emitSlotUpdate(booking.appointmentTypeId, dateStr);
        } catch (err) {
          console.error('Error emitting slot update:', err);
        }
      });
    }

    return updatedBooking;
  }

  /**
   * Clean up expired pending holds
   * This is called periodically to release slots held by users who closed their browser
   * without proper cleanup
   */
  async cleanupExpiredHolds(timeoutMinutes: number = 10): Promise<number> {
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    // Find all pending bookings older than the cutoff time
    const expiredHolds = await this.repo.findExpiredPendingBookings(cutoffTime);

    let releasedCount = 0;

    for (const hold of expiredHolds) {
      try {
        await this.repo.updateBookingStatus(hold.id, BookingStatus.CANCELLED);

        // Emit slot update for each released hold
        const dateStr = formatDateToString(hold.startTime);
        await emitSlotUpdate(hold.appointmentTypeId, dateStr);
        emitSlotChange({
          appointmentTypeId: hold.appointmentTypeId,
          date: dateStr,
          startTime: hold.startTime.toISOString(),
          endTime: hold.endTime.toISOString(),
          remainingCapacity: 0,
          available: true,
          action: 'expired',
        });

        releasedCount++;
        console.log(`⏰ Released expired hold: ${hold.id}`);
      } catch (err) {
        console.error(`Failed to release expired hold ${hold.id}:`, err);
      }
    }

    return releasedCount;
  }
}

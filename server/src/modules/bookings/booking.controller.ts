import { Request, Response, NextFunction } from "express";
import { BookingService } from "./booking.service";
import { createBookingSchema } from "./booking.validation";
import { CreateBookingDTO } from "./booking.types";

const bookingService = new BookingService();

export class BookingController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = createBookingSchema.parse(req.body) as CreateBookingDTO;
      const booking = await bookingService.createBooking(dto);
      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  }

  static async getBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new Error("Booking ID is required");
      const booking = await bookingService.getBooking(id);
      res.status(200).json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new Error("Booking ID is required");
      const booking = await bookingService.cancelBooking(id);
      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  }

  static async assignResource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new Error("Booking ID is required");
      const { resourceId } = req.body;
      if (!resourceId || typeof resourceId !== "string")
        throw new Error("resourceId is required and must be a string");

      const booking = await bookingService.assignResource(id, resourceId);
      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  }

  static async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new Error("Booking ID is required");
      const booking = await bookingService.confirmBooking(id);
      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  }

  static async getUserBookings(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // @ts-ignore - user is attached by auth middleware
      const email = req.user?.email;
      if (!email) throw new Error("User email not found");

      const bookings = await bookingService.getUserBookings(email);
      res.status(200).json(bookings);
    } catch (error) {
      next(error);
    }
  }

  static async reschedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new Error("Booking ID is required");
      const { startTime, endTime } = req.body;
      if (!startTime) throw new Error("Start time is required");

      const booking = await bookingService.rescheduleBooking(
        id,
        new Date(startTime),
        endTime ? new Date(endTime) : undefined
      );
      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  }

  static async listBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const { appointmentTypeId, type } = req.query;
      // @ts-ignore
      const userId = req.user?.id;
      // @ts-ignore
      const userRole = req.user?.role;

      // Logic: If plain GET /bookings (with optional type), it's likely the dashboard "My Bookings" list.
      // If appointmentTypeId is provided, it's filtering for a specific type (e.g. organizer view).
      
      if (userId && !appointmentTypeId) {
         const role = userRole === 'organiser' ? 'organiser' : 'customer';
         const bookings = await bookingService.getBookings(userId, { 
             role, 
             type: type as 'upcoming' | 'past' | 'cancelled' 
         });
         res.status(200).json({ success: true, data: bookings });
         return;
      }

      const filters: { appointmentTypeId?: string } = {};
      if (typeof appointmentTypeId === "string") {
        filters.appointmentTypeId = appointmentTypeId;
      }

      const bookings = await bookingService.listBookings(filters);

      res.status(200).json({ success: true, data: bookings });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id) throw new Error("Booking ID is required");
      if (!status || typeof status !== "string") {
        throw new Error("Status is required and must be a string");
      }

      // Validate status is one of the allowed values
      const validStatuses = ['request', 'booked', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const booking = await bookingService.updateStatus(id, status);
      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle payment failure - releases the slot for other customers
   */
  static async paymentFailed(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new Error("Booking ID is required");

      await bookingService.handlePaymentFailure(id);
      res.status(200).json({ success: true, message: "Slot released successfully" });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Hold a slot temporarily when user clicks Continue from slot selection
   * This immediately reserves the slot and broadcasts to other users
   */
  static async holdSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const { appointmentTypeId, customerEmail, startTime, endTime, numPeople } = req.body;

      if (!appointmentTypeId || !customerEmail || !startTime || !endTime) {
        throw new Error("appointmentTypeId, customerEmail, startTime, and endTime are required");
      }

      const hold = await bookingService.holdSlot({
        appointmentTypeId,
        customerEmail,
        startTime,
        endTime,
        numPeople,
      });

      if (!hold) {
        throw new Error("Failed to hold slot");
      }

      res.status(201).json({ success: true, holdId: hold.id, data: hold });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Release a held slot when user cancels or navigates away
   */
  static async releaseHold(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new Error("Hold ID is required");

      await bookingService.releaseHold(id);
      res.status(200).json({ success: true, message: "Slot released successfully" });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Convert a held slot to a full booking (called after questions are filled)
   */
  static async confirmHold(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { customerName, customerEmail, customerPhone, subject } = req.body;

      if (!id) throw new Error("Hold ID is required");
      if (!customerName || !customerEmail) {
        throw new Error("customerName and customerEmail are required");
      }

      const booking = await bookingService.confirmHold(id, {
        customerName,
        customerEmail,
        customerPhone,
        subject,
      });

      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  }
}

import { Request, Response, NextFunction } from "express";
import { PaymentService } from "./payment.service";
import { BookingService } from "../bookings/booking.service";

const paymentService = new PaymentService();
const bookingService = new BookingService();

export class PaymentController {
  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.body;
      if (!bookingId) {
        throw new Error("Booking ID is required");
      }

      const booking = await bookingService.getBooking(bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }

      const order = await bookingService.createPaymentOrder(bookingId);
      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  }

  static async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        bookingId,
      } = req.body;

      const isValid = paymentService.verifyPayment(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (isValid) {
        // Update booking status and payment record
        await bookingService.confirmPayment(bookingId, {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          signature: razorpay_signature,
        });

        res.status(200).json({ success: true, message: "Payment verified" });
      } else {
        throw new Error("Invalid signature");
      }
    } catch (error) {
      next(error);
    }
  }

  static async getConfig(req: Request, res: Response, next: NextFunction) {
    res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
  }
}

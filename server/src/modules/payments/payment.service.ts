import Razorpay from "razorpay";
import crypto from "crypto";
import { AppError, ErrorType } from "../../utils/error";

export class PaymentService {
  private razorpay: Razorpay;

  constructor() {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn("Razorpay keys are missing in environment variables");
    }

    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });
  }

  async createOrder(amount: number, currency: string = "INR", receipt: string) {
    try {
      const options = {
        amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
        currency,
        receipt,
      };

      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error: any) {
      console.error("Razorpay create order error:", error);
      throw new AppError(
        "Failed to create payment order",
        500,
        ErrorType.INTERNAL,
        error
      );
    }
  }

  verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      throw new AppError(
        "Invalid payment signature",
        400,
        ErrorType.VALIDATION
      );
    }

    return true;
  }

  async refundPayment(paymentId: string, amount: number) {
    try {
      // Amount should be in smallest currency unit (paise)
      // Razorpay expects amount in paise if partial refund, or undefined for full refund.
      // We are doing 95% refund, so we must specify amount.
      const refundAmount = Math.round(amount * 100);

      const refund = await this.razorpay.payments.refund(paymentId, {
        amount: refundAmount,
        speed: "normal",
      });

      return refund;
    } catch (error: any) {
      console.error("Razorpay refund error:", error);
      throw new AppError(
        "Failed to process refund",
        500,
        ErrorType.INTERNAL,
        error
      );
    }
  }
}

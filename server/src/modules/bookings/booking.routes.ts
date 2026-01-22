import { Router } from "express";
import { BookingController } from "./booking.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// ============================================
// PUBLIC ROUTES (Anyone can create/view bookings)
// ============================================

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Public (email/name required in body)
 */
router.post("/", BookingController.create);

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings (can be filtered by appointmentTypeId)
 * @access  Private (Organizer)
 */
router.get("/", authenticate, BookingController.listBookings);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking details by ID
 * @access  Public
 */
router.get("/:id", BookingController.getBooking);

/**
 * @route   POST /api/bookings/:id/cancel
 * @desc    Cancel a booking
 * @access  Public (should be verified by email in production)
 */
router.post("/:id/cancel", BookingController.cancel);

// ============================================
// PROTECTED ROUTES (Organizer actions)
// ============================================

/**
 * @route   GET /api/bookings/user/all
 * @desc    Get all bookings for the authenticated user
 * @access  Private
 */
router.get("/user/all", authenticate, BookingController.getUserBookings);

/**
 * @route   PATCH /api/bookings/:id/assign-resource
 * @desc    Assign a resource to a pending booking
 * @access  Private (Organizer)
 */
router.patch(
  "/:id/assign-resource",
  authenticate,
  BookingController.assignResource
);

/**
 * @route   PATCH /api/bookings/:id/confirm
 * @desc    Confirm a pending booking
 * @access  Private (Organizer)
 */
router.patch("/:id/confirm", authenticate, BookingController.confirm);

/**
 * @route   PATCH /api/bookings/:id/reschedule
 * @desc    Reschedule a booking
 * @access  Private
 */
router.patch("/:id/reschedule", authenticate, BookingController.reschedule);

/**
 * @route   PATCH /api/bookings/:id/status
 * @desc    Update booking status (request/booked/cancelled)
 * @access  Private (Organizer)
 */
router.patch("/:id/status", authenticate, BookingController.updateStatus);

/**
 * @route   POST /api/bookings/:id/payment-failed
 * @desc    Handle payment failure - releases the slot for other customers
 * @access  Public (used by client when payment fails/times out)
 */
router.post("/:id/payment-failed", BookingController.paymentFailed);

// ============================================
// SLOT HOLD ROUTES (Real-time slot reservation)
// ============================================

/**
 * @route   POST /api/bookings/hold
 * @desc    Hold a slot temporarily when user clicks Continue
 *          This immediately reserves the slot and broadcasts to other users
 * @access  Public (requires email in body)
 */
router.post("/hold", BookingController.holdSlot);

/**
 * @route   POST /api/bookings/:id/release
 * @desc    Release a held slot when user cancels or navigates away
 * @access  Public
 */
router.post("/:id/release", BookingController.releaseHold);

/**
 * @route   POST /api/bookings/:id/confirm-hold
 * @desc    Convert a held slot to a full booking (after questions are filled)
 * @access  Public
 */
router.post("/:id/confirm-hold", BookingController.confirmHold);

export default router;

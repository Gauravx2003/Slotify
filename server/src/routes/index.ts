import { Router } from 'express';
import { authRoutes } from '../modules/auth';
import { userRoutes } from '../modules/user';
import { otpRoutes } from '../modules/otp';
import { appointmentsRoutes } from '../modules/appointments';
import { schedulesRoutes } from '../modules/schedules';
import { bookingRoutes } from '../modules/bookings';
import { resourceRoutes } from '../modules/resources';
import { adminRoutes } from '../modules/admin';
import { reportingRoutes } from '../modules/reporting';
import paymentRoutes from "../modules/payments/payment.routes";


const router = Router();

// Force reload timestamp: 2025-12-21T06:59:41+05:30

// API Routes
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/otp', otpRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/schedules', schedulesRoutes);
router.use('/bookings', bookingRoutes);
router.use('/resources', resourceRoutes);
router.use('/admin', adminRoutes);
router.use('/reporting', reportingRoutes);
router.use("/payments", paymentRoutes);


// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;

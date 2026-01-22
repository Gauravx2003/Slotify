/**
 * Admin Dashboard Module - Routes
 * Defines all admin-related API endpoints
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validateQuery, validateBody, validateParams } from '../../middleware/validation.middleware';
import * as adminController from './admin.controller';
import {
    userListQuerySchema,
    updateUserStatusSchema,
    updateUserRoleSchema,
    userIdParamSchema,
    appointmentListQuerySchema,
    bookingListQuerySchema,
    updateBookingStatusSchema,
    bookingIdParamSchema,
} from './admin.validator';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// ============================================
// DASHBOARD STATISTICS ROUTES
// ============================================

/**
 * GET /admin/dashboard
 * Get overall dashboard statistics
 * - Total users, organisers, customers, admins
 * - Total appointments
 * - Total bookings (active, completed, cancelled, pending)
 */
router.get('/dashboard', adminController.getDashboardStats);

/**
 * GET /admin/stats/users
 * Get detailed user statistics
 * - Breakdown by role
 * - Active/inactive counts
 * - Verified/unverified counts
 */
router.get('/stats/users', adminController.getUserStats);

/**
 * GET /admin/stats/appointments
 * Get appointment statistics
 * - Total, published, unpublished counts
 * - Top organisers by appointment count
 */
router.get('/stats/appointments', adminController.getAppointmentStats);

/**
 * GET /admin/stats/bookings
 * Get booking statistics
 * - Breakdown by status
 * - Today's bookings
 * - Upcoming bookings
 */
router.get('/stats/bookings', adminController.getBookingStats);

// ============================================
// USER MANAGEMENT ROUTES
// ============================================

/**
 * GET /admin/users
 * List all users with pagination and filtering
 * Query params: page, limit, role, isActive, search
 */
router.get('/users', validateQuery(userListQuerySchema), adminController.getUsers);

/**
 * GET /admin/users/:id
 * Get a single user by ID
 */
router.get(
    '/users/:id',
    validateParams(userIdParamSchema),
    adminController.getUserById
);

/**
 * PATCH /admin/users/:id/status
 * Activate or deactivate a user account
 * Body: { isActive: boolean }
 */
router.patch(
    '/users/:id/status',
    validateParams(userIdParamSchema),
    validateBody(updateUserStatusSchema),
    adminController.updateUserStatus
);

/**
 * PATCH /admin/users/:id/role
 * Update user role
 * Body: { role: 'customer' | 'organiser' | 'admin' }
 */
router.patch(
    '/users/:id/role',
    validateParams(userIdParamSchema),
    validateBody(updateUserRoleSchema),
    adminController.updateUserRole
);

// ============================================
// APPOINTMENT MANAGEMENT ROUTES
// ============================================

/**
 * GET /admin/appointments
 * List all appointments with pagination and filtering
 * Query params: page, limit, isPublished, search
 */
router.get(
    '/appointments',
    validateQuery(appointmentListQuerySchema),
    adminController.getAppointments
);

// ============================================
// BOOKING MANAGEMENT ROUTES
// ============================================

/**
 * GET /admin/bookings
 * List all bookings with pagination and filtering
 * Query params: page, limit, status, search, fromDate, toDate
 */
router.get(
    '/bookings',
    validateQuery(bookingListQuerySchema),
    adminController.getBookings
);

/**
 * PATCH /admin/bookings/:id/status
 * Update booking status
 * Body: { status: 'request' | 'booked' | 'cancelled' | 'completed' }
 */
router.patch(
    '/bookings/:id/status',
    validateParams(bookingIdParamSchema),
    validateBody(updateBookingStatusSchema),
    adminController.updateBookingStatus
);

// ============================================
// ANALYTICS ROUTES
// ============================================

/**
 * GET /admin/analytics/peak-hours
 * Get peak booking hours (last 30 days)
 */
router.get('/analytics/peak-hours', adminController.getPeakHours);

export default router;

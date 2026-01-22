/**
 * Admin Dashboard Module - Controller Layer
 * Handles HTTP request/response for admin dashboard endpoints
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { asyncHandler, AuthorizationError } from '../../utils/error';
import { successResponse, paginatedResponse, PaginationMeta } from '../../utils/response';
import * as adminService from './admin.service';
import { UserListQuery, AppointmentListQuery, BookingListQuery } from './admin.validator';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

// ============================================
// ROLE CHECK HELPER
// ============================================

/**
 * Verify the user has admin role by checking the database
 */
async function requireAdmin(req: AuthRequest): Promise<string> {
    const userId = req.user?.id;

    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    // Fetch user from database to check role
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { role: true },
    });

    if (!user || user.role !== 'admin') {
        throw new AuthorizationError('Admin access required');
    }

    return userId;
}

// ============================================
// DASHBOARD STATISTICS ENDPOINTS
// ============================================

/**
 * GET /admin/dashboard
 * Get overall dashboard statistics
 */
export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    await requireAdmin(req);

    const stats = await adminService.getDashboardStats();

    res.json(successResponse(stats, 'Dashboard statistics retrieved successfully'));
});

/**
 * GET /admin/stats/users
 * Get detailed user statistics
 */
export const getUserStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    await requireAdmin(req);

    const stats = await adminService.getUserStats();

    res.json(successResponse(stats, 'User statistics retrieved successfully'));
});

/**
 * GET /admin/stats/appointments
 * Get appointment statistics
 */
export const getAppointmentStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    await requireAdmin(req);

    const stats = await adminService.getAppointmentStats();

    res.json(successResponse(stats, 'Appointment statistics retrieved successfully'));
});

/**
 * GET /admin/stats/bookings
 * Get booking statistics
 */
export const getBookingStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    await requireAdmin(req);

    const stats = await adminService.getBookingStats();

    res.json(successResponse(stats, 'Booking statistics retrieved successfully'));
});

// ============================================
// USER MANAGEMENT ENDPOINTS
// ============================================

/**
 * GET /admin/users
 * List all users with pagination and filtering
 */
export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    await requireAdmin(req);

    // Use validated query from middleware or fallback to req.query
    const query = (res.locals.validatedQuery || req.query) as UserListQuery;

    const { page = 1, limit = 20, role, isActive, search } = query;

    const { data, total } = await adminService.getUsers({
        page,
        limit,
        role,
        isActive,
        search,
    });

    const totalPages = Math.ceil(total / limit);
    const pagination: PaginationMeta = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };

    res.json(paginatedResponse(data, pagination, 'Users retrieved successfully'));
});

/**
 * GET /admin/users/:id
 * Get a single user by ID
 */
export const getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
    await requireAdmin(req);

    const { id } = req.params;
    const user = await adminService.getUserById(id);

    res.json(successResponse(user, 'User retrieved successfully'));
});

/**
 * PATCH /admin/users/:id/status
 * Activate or deactivate a user account
 */
export const updateUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    await requireAdmin(req);

    const { id } = req.params;
    const { isActive } = res.locals.validatedBody || req.body;

    const updated = await adminService.updateUserStatus(id, isActive);

    const action = isActive ? 'activated' : 'deactivated';
    res.json(successResponse(updated, `User ${action} successfully`));
});

/**
 * PATCH /admin/users/:id/role
 * Update user role
 */
export const updateUserRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = await requireAdmin(req);

    const { id } = req.params;
    const { role } = res.locals.validatedBody || req.body;

    const updated = await adminService.updateUserRole(id, role, adminId);

    res.json(successResponse(updated, `User role updated to ${role} successfully`));
});

// ============================================
// APPOINTMENT MANAGEMENT ENDPOINTS
// ============================================

/**
 * GET /admin/appointments
 * List all appointments with pagination and filtering
 */
export const getAppointments = asyncHandler(async (req: AuthRequest, res: Response) => {
    await requireAdmin(req);

    const query = (res.locals.validatedQuery || req.query) as AppointmentListQuery;
    const { page = 1, limit = 20, isPublished, search } = query;

    const { data, total } = await adminService.getAppointments({
        page,
        limit,
        isPublished,
        search,
    });

    const totalPages = Math.ceil(total / limit);
    const pagination: PaginationMeta = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };

    res.json(paginatedResponse(data, pagination, 'Appointments retrieved successfully'));
});

// ============================================
// BOOKING MANAGEMENT ENDPOINTS
// ============================================

/**
 * GET /admin/bookings
 * List all bookings with pagination and filtering
 */
export const getBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
    await requireAdmin(req);

    const query = (res.locals.validatedQuery || req.query) as BookingListQuery;
    const { page = 1, limit = 20, status, search, fromDate, toDate } = query;

    const { data, total } = await adminService.getBookings({
        page,
        limit,
        status,
        search,
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
    });

    const totalPages = Math.ceil(total / limit);
    const pagination: PaginationMeta = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };

    res.json(paginatedResponse(data, pagination, 'Bookings retrieved successfully'));
});

/**
 * PATCH /admin/bookings/:id/status
 * Update booking status
 */
export const updateBookingStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    await requireAdmin(req);

    const { id } = req.params;
    const { status } = res.locals.validatedBody || req.body;

    const updated = await adminService.updateBookingStatus(id, status);

    res.json(successResponse(updated, `Booking status updated to ${status} successfully`));
});

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

/**
 * GET /admin/analytics/peak-hours
 * Get peak booking hours analytics
 */
export const getPeakHours = asyncHandler(async (req: AuthRequest, res: Response) => {
    await requireAdmin(req);

    const peakHours = await adminService.getPeakHours();

    res.json(successResponse(peakHours, 'Peak hours analytics retrieved successfully'));
});


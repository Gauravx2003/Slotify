/**
 * Admin Dashboard Module - Validation Schemas
 * Zod schemas for validating admin-related requests
 */

import { z } from 'zod';

// ============================================
// QUERY PARAMETER SCHEMAS
// ============================================

/**
 * User list query parameters schema
 */
export const userListQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    role: z.enum(['customer', 'organiser', 'admin']).optional(),
    isActive: z
        .string()
        .optional()
        .transform((val) => {
            if (val === 'true') return true;
            if (val === 'false') return false;
            return undefined;
        }),
    search: z.string().optional(),
});

/**
 * Appointment list query parameters schema
 */
export const appointmentListQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    isPublished: z
        .string()
        .optional()
        .transform((val) => {
            if (val === 'true') return true;
            if (val === 'false') return false;
            return undefined;
        }),
    search: z.string().optional(),
});

/**
 * Booking list query parameters schema
 */
export const bookingListQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['request', 'booked', 'cancelled', 'completed']).optional(),
    search: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
});

// ============================================
// BODY SCHEMAS
// ============================================

/**
 * Update user status schema
 */
export const updateUserStatusSchema = z.object({
    isActive: z.boolean(),
});

/**
 * Update user role schema
 */
export const updateUserRoleSchema = z.object({
    role: z.enum(['customer', 'organiser', 'admin']),
});

/**
 * Update booking status schema
 */
export const updateBookingStatusSchema = z.object({
    status: z.enum(['request', 'booked', 'cancelled', 'completed']),
});

// ============================================
// PARAM SCHEMAS
// ============================================

/**
 * User ID parameter schema
 */
export const userIdParamSchema = z.object({
    id: z.string().min(1, 'User ID is required'),
});

/**
 * Booking ID parameter schema
 */
export const bookingIdParamSchema = z.object({
    id: z.string().min(1, 'Booking ID is required'),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type AppointmentListQuery = z.infer<typeof appointmentListQuerySchema>;
export type BookingListQuery = z.infer<typeof bookingListQuerySchema>;
export type UpdateUserStatusBody = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserRoleBody = z.infer<typeof updateUserRoleSchema>;
export type UpdateBookingStatusBody = z.infer<typeof updateBookingStatusSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type BookingIdParam = z.infer<typeof bookingIdParamSchema>;

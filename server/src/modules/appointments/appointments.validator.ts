/**
 * Appointment Types Module - Zod Validators
 */

import { z } from 'zod';
import { DAYS_OF_WEEK } from './appointments.types';

// Regex for date format validation (YYYY-MM-DD)
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Create appointment type schema
export const createAppointmentTypeSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .max(255, 'Title must be 255 characters or less'),
    description: z.string().max(2000, 'Description too long').optional(),
    durationMinutes: z
        .number()
        .int('Duration must be a whole number')
        .min(5, 'Duration must be at least 5 minutes')
        .max(480, 'Duration cannot exceed 8 hours')
        .optional()
        .default(30),
    location: z.string().max(500, 'Location too long').optional().nullable(),
    assignmentType: z.enum(['automatic', 'by_visitor']).optional().default('automatic'),
    isPaid: z.boolean().optional().default(false),
    bookingFeeCents: z
        .number()
        .int('Fee must be a whole number')
        .min(0, 'Fee cannot be negative')
        .optional()
        .nullable(),
    manageCapacity: z.boolean().optional().default(false),
    maxCapacity: z
        .number()
        .int('Capacity must be a whole number')
        .min(1, 'Capacity must be at least 1')
        .optional()
        .default(1),
    manualConfirmation: z.boolean().optional().default(false),
    cancellationHours: z
        .number()
        .int('Cancellation hours must be a whole number')
        .min(0, 'Cancellation hours cannot be negative')
        .optional()
        .default(1),
    slotCreationMode: z.enum(['automatic', 'manual']).optional().default('automatic'),
    introMessage: z.string().max(2000, 'Intro message too long').optional().nullable(),
    confirmationMessage: z
        .string()
        .max(2000, 'Confirmation message too long')
        .optional()
        .nullable(),
});

// Update appointment type schema (all fields optional)
export const updateAppointmentTypeSchema = z.object({
    title: z.string().min(1, 'Title cannot be empty').max(255, 'Title too long').optional(),
    description: z.string().max(2000, 'Description too long').optional().nullable(),
    durationMinutes: z
        .number()
        .int('Duration must be a whole number')
        .min(5, 'Duration must be at least 5 minutes')
        .max(480, 'Duration cannot exceed 8 hours')
        .optional(),
    location: z.string().max(500, 'Location too long').optional().nullable(),
    assignmentType: z.enum(['automatic', 'by_visitor']).optional(),
    isPublished: z.boolean().optional(),
    isPaid: z.boolean().optional(),
    bookingFeeCents: z
        .number()
        .int('Fee must be a whole number')
        .min(0, 'Fee cannot be negative')
        .optional()
        .nullable(),
    manageCapacity: z.boolean().optional(),
    maxCapacity: z
        .number()
        .int('Capacity must be a whole number')
        .min(1, 'Capacity must be at least 1')
        .optional(),
    manualConfirmation: z.boolean().optional(),
    cancellationHours: z
        .number()
        .int('Cancellation hours must be a whole number')
        .min(0, 'Cancellation hours cannot be negative')
        .optional(),
    slotCreationMode: z.enum(['automatic', 'manual']).optional(),
    introMessage: z.string().max(2000, 'Intro message too long').optional().nullable(),
    confirmationMessage: z.string().max(2000, 'Confirmation message too long').optional().nullable(),
});

// Availability query schema
export const availabilityQuerySchema = z.object({
    date: z
        .string()
        .regex(DATE_REGEX, 'Date must be in YYYY-MM-DD format')
        .refine(
            (val) => {
                const parsed = new Date(val);
                return !isNaN(parsed.getTime());
            },
            { message: 'Invalid date' }
        ),
});

// ID param validation
export const idParamSchema = z.object({
    id: z.string().min(1, 'ID is required'),
});

// ID and Question ID param validation
export const questionIdParamSchema = z.object({
    id: z.string().min(1, 'ID is required'),
    questionId: z.string().min(1, 'Question ID is required'),
});

// List query params validation
export const listQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    isPublished: z
        .enum(['true', 'false'])
        .transform((val) => val === 'true')
        .optional(),
});


/**
 * Schedules Module - Zod Validators
 */

import { z } from 'zod';
import { DAYS_OF_WEEK } from './schedules.types';

// Regex for time format validation (HH:MM)
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Parse time string (HH:MM) to minutes from midnight for comparison
 */
function parseTimeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Create schedule schema
export const createScheduleSchema = z
    .object({
        dayOfWeek: z.enum(DAYS_OF_WEEK, {
            errorMap: () => ({
                message: `Day must be one of: ${DAYS_OF_WEEK.join(', ')}`,
            }),
        }),
        fromTime: z
            .string()
            .regex(TIME_REGEX, 'From time must be in HH:MM format (24-hour)'),
        toTime: z
            .string()
            .regex(TIME_REGEX, 'To time must be in HH:MM format (24-hour)'),
    })
    .refine(
        (data) => {
            const fromMinutes = parseTimeToMinutes(data.fromTime);
            const toMinutes = parseTimeToMinutes(data.toTime);
            return toMinutes > fromMinutes;
        },
        {
            message: 'End time must be after start time',
            path: ['toTime'],
        }
    );

// Update schedule schema (all fields optional but must pass validation if provided)
export const updateScheduleSchema = z
    .object({
        dayOfWeek: z
            .enum(DAYS_OF_WEEK, {
                errorMap: () => ({
                    message: `Day must be one of: ${DAYS_OF_WEEK.join(', ')}`,
                }),
            })
            .optional(),
        fromTime: z
            .string()
            .regex(TIME_REGEX, 'From time must be in HH:MM format (24-hour)')
            .optional(),
        toTime: z
            .string()
            .regex(TIME_REGEX, 'To time must be in HH:MM format (24-hour)')
            .optional(),
    })
    .refine(
        (data) => {
            // Only validate time order if both times are provided
            if (data.fromTime && data.toTime) {
                const fromMinutes = parseTimeToMinutes(data.fromTime);
                const toMinutes = parseTimeToMinutes(data.toTime);
                return toMinutes > fromMinutes;
            }
            return true;
        },
        {
            message: 'End time must be after start time',
            path: ['toTime'],
        }
    );

// ID param validation
export const idParamSchema = z.object({
    id: z.string().min(1, 'ID is required'),
});

// Appointment type ID param validation (for nested routes)
export const appointmentTypeIdParamSchema = z.object({
    id: z.string().min(1, 'Appointment type ID is required'),
});

// Schedule ID param validation
export const scheduleIdParamSchema = z.object({
    id: z.string().min(1, 'Schedule ID is required'),
});


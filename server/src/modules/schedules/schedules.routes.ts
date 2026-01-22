/**
 * Schedules Module - Routes
 * 
 * Note: GET /appointments/:id/schedules is mounted in the appointments routes
 * This file contains routes for /schedules endpoints
 */

import { Router } from 'express';
import * as schedulesController from './schedules.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateBody, validateParams } from '../../middleware/validation.middleware';
import {
    createScheduleSchema,
    updateScheduleSchema,
    scheduleIdParamSchema,
} from './schedules.validator';
import { z } from 'zod';

const router = Router();

// All schedule routes require authentication
router.use(authenticate);

// Regex for time format validation (HH:MM)
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Parse time string to minutes for comparison
function parseTimeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Days of week constant
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

// Extended create schema that includes appointmentTypeId
const createScheduleWithAppointmentSchema = z
    .object({
        appointmentTypeId: z.string().min(1, 'Appointment type ID is required'),
        dayOfWeek: z.enum(DAYS_OF_WEEK, {
            errorMap: () => ({ message: `Day must be one of: ${DAYS_OF_WEEK.join(', ')}` }),
        }),
        fromTime: z.string().regex(TIME_REGEX, 'From time must be in HH:MM format (24-hour)'),
        toTime: z.string().regex(TIME_REGEX, 'To time must be in HH:MM format (24-hour)'),
    })
    .refine(
        (data) => {
            const fromMinutes = parseTimeToMinutes(data.fromTime);
            const toMinutes = parseTimeToMinutes(data.toTime);
            return toMinutes > fromMinutes;
        },
        { message: 'End time must be after start time', path: ['toTime'] }
    );

/**
 * @route   POST /api/schedules
 * @desc    Create a new schedule for an appointment type
 * @access  Private (Organiser - owner of appointment type)
 */
router.post(
    '/',
    validateBody(createScheduleWithAppointmentSchema),
    schedulesController.createSchedule
);

/**
 * @route   PATCH /api/schedules/:id
 * @desc    Update a schedule
 * @access  Private (Owner only)
 */
router.patch(
    '/:id',
    validateParams(scheduleIdParamSchema),
    validateBody(updateScheduleSchema),
    schedulesController.updateSchedule
);

/**
 * @route   DELETE /api/schedules/:id
 * @desc    Delete a schedule
 * @access  Private (Owner only)
 */
router.delete(
    '/:id',
    validateParams(scheduleIdParamSchema),
    schedulesController.deleteSchedule
);

export default router;


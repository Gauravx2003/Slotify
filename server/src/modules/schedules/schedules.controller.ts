/**
 * Schedules Module - Controller Layer
 * Handles HTTP request/response for schedule endpoints
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { asyncHandler, AuthorizationError } from '../../utils/error';
import { successResponse } from '../../utils/response';
import * as schedulesService from './schedules.service';

/**
 * POST /schedules
 * Create a new schedule
 * Body must include appointmentTypeId along with schedule data
 */
export const createSchedule = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    const { appointmentTypeId, ...scheduleData } = req.body;

    const schedule = await schedulesService.createSchedule(
        appointmentTypeId,
        userId,
        scheduleData
    );

    res.status(201).json(successResponse(schedule, 'Schedule created successfully'));
});

/**
 * GET /appointments/:id/schedules
 * Get all schedules for an appointment type
 */
export const getSchedulesByAppointmentType = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.id;
        if (!userId) {
            throw new AuthorizationError('User not authenticated');
        }

        const { id: appointmentTypeId } = req.params;

        const schedules = await schedulesService.getSchedulesByAppointmentType(
            appointmentTypeId,
            userId
        );

        res.json(
            successResponse(
                {
                    appointmentTypeId,
                    schedules,
                    count: schedules.length,
                },
                'Schedules retrieved successfully'
            )
        );
    }
);

/**
 * POST /appointments/:id/schedules
 * Create multiple schedules for an appointment type
 */
export const createSchedules = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    const { id: appointmentTypeId } = req.params;
    const { schedules } = req.body;

    if (!Array.isArray(schedules)) {
        throw new Error('Schedules must be an array');
    }

    const createdSchedules = await schedulesService.createMultipleSchedules(
        appointmentTypeId,
        userId,
        schedules
    );

    res.status(201).json(successResponse(createdSchedules, 'Schedules created successfully'));
});

/**
 * PATCH /schedules/:id
 * Update a schedule
 */
export const updateSchedule = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    const { id: scheduleId } = req.params;

    const updated = await schedulesService.updateSchedule(scheduleId, userId, req.body);

    res.json(successResponse(updated, 'Schedule updated successfully'));
});

/**
 * DELETE /schedules/:id
 * Delete a schedule
 */
export const deleteSchedule = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    const { id: scheduleId } = req.params;

    await schedulesService.deleteSchedule(scheduleId, userId);

    res.json(successResponse(null, 'Schedule deleted successfully'));
});


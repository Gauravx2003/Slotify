/**
 * Schedules Module - Service Layer
 * Handles business logic for schedule management
 */

import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import { schedules, appointmentTypes, Schedule } from '../../db/schema';
import { NotFoundError, ValidationError, AuthorizationError } from '../../utils/error';
import { CreateSchedulePayload, UpdateSchedulePayload, DayOfWeek } from './schedules.types';
import crypto from 'crypto';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse time string (HH:MM) to minutes from midnight
 */
function parseTimeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Check if two time ranges overlap
 */
function doTimesOverlap(
    from1: string,
    to1: string,
    from2: string,
    to2: string
): boolean {
    const start1 = parseTimeToMinutes(from1);
    const end1 = parseTimeToMinutes(to1);
    const start2 = parseTimeToMinutes(from2);
    const end2 = parseTimeToMinutes(to2);

    // Overlap occurs if one range doesn't completely precede or follow the other
    return start1 < end2 && start2 < end1;
}

/**
 * Verify appointment type ownership
 */
async function verifyAppointmentTypeOwnership(
    appointmentTypeId: string,
    ownerId: string
): Promise<void> {
    const appointmentType = await db.query.appointmentTypes.findFirst({
        where: and(
            eq(appointmentTypes.id, appointmentTypeId),
            eq(appointmentTypes.ownerId, ownerId)
        ),
    });

    if (!appointmentType) {
        throw new NotFoundError('Appointment type');
    }
}

/**
 * Check for overlapping schedules on the same day
 */
async function checkScheduleOverlap(
    appointmentTypeId: string,
    dayOfWeek: DayOfWeek,
    fromTime: string,
    toTime: string,
    excludeScheduleId?: string
): Promise<void> {
    const existingSchedules = await db.query.schedules.findMany({
        where: and(
            eq(schedules.appointmentTypeId, appointmentTypeId),
            eq(schedules.dayOfWeek, dayOfWeek)
        ),
    });

    for (const existing of existingSchedules) {
        // Skip the schedule being updated
        if (excludeScheduleId && existing.id === excludeScheduleId) {
            continue;
        }

        if (doTimesOverlap(fromTime, toTime, existing.fromTime, existing.toTime)) {
            throw new ValidationError(
                `Schedule overlaps with existing schedule on ${dayOfWeek} (${existing.fromTime} - ${existing.toTime})`
            );
        }
    }
}

// ============================================
// SCHEDULE CRUD
// ============================================

/**
 * Create a new schedule for an appointment type
 */
export async function createSchedule(
    appointmentTypeId: string,
    ownerId: string,
    payload: CreateSchedulePayload
): Promise<Schedule> {
    // Verify ownership
    await verifyAppointmentTypeOwnership(appointmentTypeId, ownerId);

    // Check for overlapping schedules
    await checkScheduleOverlap(
        appointmentTypeId,
        payload.dayOfWeek,
        payload.fromTime,
        payload.toTime
    );

    const id = crypto.randomUUID();
    const now = new Date();

    const [created] = await db
        .insert(schedules)
        .values({
            id,
            appointmentTypeId,
            dayOfWeek: payload.dayOfWeek,
            fromTime: payload.fromTime,
            toTime: payload.toTime,
            createdAt: now,
            updatedAt: now,
        })
        .returning();

    return created;
}

/**
 * Create multiple schedules for an appointment type
 */
export async function createMultipleSchedules(
    appointmentTypeId: string,
    ownerId: string,
    schedulesData: CreateSchedulePayload[]
): Promise<Schedule[]> {
    // Verify ownership
    await verifyAppointmentTypeOwnership(appointmentTypeId, ownerId);

    const createdSchedules: Schedule[] = [];
    const now = new Date();

    for (const scheduleData of schedulesData) {
        // Check for overlapping schedules
        await checkScheduleOverlap(
            appointmentTypeId,
            scheduleData.dayOfWeek,
            scheduleData.fromTime,
            scheduleData.toTime
        );

        const id = crypto.randomUUID();

        const [created] = await db
            .insert(schedules)
            .values({
                id,
                appointmentTypeId,
                dayOfWeek: scheduleData.dayOfWeek,
                fromTime: scheduleData.fromTime,
                toTime: scheduleData.toTime,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        createdSchedules.push(created);
    }

    return createdSchedules;
}

/**
 * Get all schedules for an appointment type
 */
export async function getSchedulesByAppointmentType(
    appointmentTypeId: string,
    ownerId: string
): Promise<Schedule[]> {
    // Verify ownership
    await verifyAppointmentTypeOwnership(appointmentTypeId, ownerId);

    const results = await db.query.schedules.findMany({
        where: eq(schedules.appointmentTypeId, appointmentTypeId),
        orderBy: (schedules, { asc }) => [
            // Custom ordering by day of week
            asc(schedules.dayOfWeek),
            asc(schedules.fromTime),
        ],
    });

    return results;
}

/**
 * Get a single schedule by ID
 */
export async function getScheduleById(
    scheduleId: string,
    ownerId: string
): Promise<Schedule> {
    const schedule = await db.query.schedules.findFirst({
        where: eq(schedules.id, scheduleId),
    });

    if (!schedule) {
        throw new NotFoundError('Schedule');
    }

    // Verify ownership through appointment type
    await verifyAppointmentTypeOwnership(schedule.appointmentTypeId, ownerId);

    return schedule;
}

/**
 * Update a schedule
 */
export async function updateSchedule(
    scheduleId: string,
    ownerId: string,
    payload: UpdateSchedulePayload
): Promise<Schedule> {
    // Get existing schedule and verify ownership
    const existing = await getScheduleById(scheduleId, ownerId);

    // Merge existing values with updates
    const newDayOfWeek = (payload.dayOfWeek ?? existing.dayOfWeek) as DayOfWeek;
    const newFromTime = payload.fromTime ?? existing.fromTime;
    const newToTime = payload.toTime ?? existing.toTime;

    // If times are being updated, validate that end time is after start time
    if (payload.fromTime || payload.toTime) {
        const fromMinutes = parseTimeToMinutes(newFromTime);
        const toMinutes = parseTimeToMinutes(newToTime);
        
        if (toMinutes <= fromMinutes) {
            throw new ValidationError('End time must be after start time');
        }
    }

    // Check for overlaps (excluding current schedule)
    await checkScheduleOverlap(
        existing.appointmentTypeId,
        newDayOfWeek,
        newFromTime,
        newToTime,
        scheduleId
    );

    // Build update object
    const updateData: Record<string, any> = {
        updatedAt: new Date(),
    };

    if (payload.dayOfWeek !== undefined) updateData.dayOfWeek = payload.dayOfWeek;
    if (payload.fromTime !== undefined) updateData.fromTime = payload.fromTime;
    if (payload.toTime !== undefined) updateData.toTime = payload.toTime;

    const [updated] = await db
        .update(schedules)
        .set(updateData)
        .where(eq(schedules.id, scheduleId))
        .returning();

    if (!updated) {
        throw new NotFoundError('Schedule');
    }

    return updated;
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(
    scheduleId: string,
    ownerId: string
): Promise<void> {
    // Verify ownership first
    await getScheduleById(scheduleId, ownerId);

    await db.delete(schedules).where(eq(schedules.id, scheduleId));
}


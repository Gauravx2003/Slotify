/**
 * Appointment Types Module - Service Layer
 * Handles business logic for appointment type management and availability calculation
 */

import { eq, and, sql, gte, lt, gt, not, or, desc } from 'drizzle-orm';

// ... existing code ...

import { db } from '../../db';
import { appointmentTypes, schedules, bookings, AppointmentType, Schedule } from '../../db/schema';
import { NotFoundError, ValidationError, AuthorizationError } from '../../utils/error';
import {
    CreateAppointmentTypePayload,
    UpdateAppointmentTypePayload,
    AvailabilitySlot,
    DAYS_OF_WEEK,
    DayOfWeek,
} from './appointments.types';
import crypto from 'crypto';

// ============================================
// CONSTANTS
// ============================================

const BOOKING_STATUS_ACTIVE = ['request', 'booked', 'pending', 'confirmed'] as const;

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
 * Format minutes from midnight to HH:MM string
 */
function minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get day of week name from Date object
 */
function getDayOfWeek(date: Date): DayOfWeek {
    const dayIndex = date.getDay();
    // JavaScript getDay(): 0=Sunday, 1=Monday, ...
    // Convert to our format: Monday=0, ..., Sunday=6
    const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    return DAYS_OF_WEEK[mappedIndex];
}

/**
 * Check if a date is in the past (before today)
 */
function isDateInPast(dateStr: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate < today;
}

/**
 * Check if a slot overlaps with any existing booking
 * Returns the count of people already booked in this slot
 */
function countBookingsInSlot(
    slotStart: Date,
    slotEnd: Date,
    existingBookings: Array<{ startTime: Date; endTime: Date; numPeople: number | null }>
): number {
    let bookedCount = 0;

    for (const booking of existingBookings) {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);

        // Check for overlap: slot overlaps if it doesn't end before booking starts
        // AND doesn't start after booking ends
        const hasOverlap = slotStart < bookingEnd && slotEnd > bookingStart;

        if (hasOverlap) {
            bookedCount += booking.numPeople || 1;
        }
    }

    return bookedCount;
}

/**
 * Generate unique ID using crypto
 */
function generateId(): string {
    return crypto.randomUUID();
}

/**
 * Generate unique share token (shorter, URL-safe)
 */
function generateShareToken(): string {
    return crypto.randomBytes(12).toString('base64url');
}

// ============================================
// APPOINTMENT TYPE CRUD
// ============================================

/**
 * Create a new appointment type
 */
export async function createAppointmentType(
    ownerId: string,
    payload: CreateAppointmentTypePayload
): Promise<AppointmentType> {
    const id = generateId();
    const now = new Date();

    const [created] = await db
        .insert(appointmentTypes)
        .values({
            id,
            ownerId,
            title: payload.title,
            description: payload.description ?? null,
            durationMinutes: payload.durationMinutes ?? 30,
            location: payload.location ?? null,
            assignmentType: payload.assignmentType ?? 'automatic',
            isPublished: false, // Always start unpublished
            isPaid: payload.isPaid ?? false,
            bookingFeeCents: payload.bookingFeeCents ?? null,
            manageCapacity: payload.manageCapacity ?? false,
            maxCapacity: payload.maxCapacity ?? 1,
            manualConfirmation: payload.manualConfirmation ?? false,
            cancellationHours: payload.cancellationHours ?? 1,
            slotCreationMode: payload.slotCreationMode ?? 'automatic',
            shareToken: generateShareToken(), // Generate share token for unpublished sharing
            introMessage: payload.introMessage ?? null,
            confirmationMessage: payload.confirmationMessage ?? null,
            createdAt: now,
            updatedAt: now,
        })
        .returning();

    return created;
}

/**
 * Get all appointment types for an owner
 */
export async function getAppointmentTypes(
    ownerId: string,
    options: { page: number; limit: number; isPublished?: boolean }
): Promise<{ data: any[]; total: number }> {
    const { page, limit, isPublished } = options;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(appointmentTypes.ownerId, ownerId)];
    if (isPublished !== undefined) {
        conditions.push(eq(appointmentTypes.isPublished, isPublished));
    }

    // Get total count
    const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(appointmentTypes)
        .where(and(...conditions));

    // Get paginated results
    const results = await db.query.appointmentTypes.findMany({
        where: and(...conditions),
        limit,
        offset,
        orderBy: (appointmentTypes, { desc }) => [desc(appointmentTypes.createdAt)],
    });

    // Get counts for each appointment type
    const { bookings, appointmentTypeResources, comments } = await import('../../db/schema');

    const resultsWithCounts = await Promise.all(
        results.map(async (appointment) => {
            // Count bookings
            const bookingCountResult = await db
                .select({ bookingCount: sql<number>`count(*)::int` })
                .from(bookings)
                .where(eq(bookings.appointmentTypeId, appointment.id));

            const bookingCount = bookingCountResult[0]?.bookingCount || 0;

            // Count resources
            const resourceCountResult = await db
                .select({ resourceCount: sql<number>`count(*)::int` })
                .from(appointmentTypeResources)
                .where(eq(appointmentTypeResources.appointmentTypeId, appointment.id));

            const resourceCount = resourceCountResult[0]?.resourceCount || 0;

            // Count comments
            const commentCountResult = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(comments)
                .where(eq(comments.appointmentTypeId, appointment.id));

            const commentCount = commentCountResult[0]?.count || 0;

            return {
                ...appointment,
                _count: {
                    bookings: bookingCount,
                    resources: resourceCount,
                    comments: commentCount,
                },
            };
        })
    );

    return { data: resultsWithCounts, total: count };
}

/**
 * Get a single appointment type by ID
 */
export async function getAppointmentTypeById(
    id: string,
    ownerId?: string
): Promise<AppointmentType> {
    const conditions = [eq(appointmentTypes.id, id)];
    if (ownerId) {
        conditions.push(eq(appointmentTypes.ownerId, ownerId));
    }

    const result = await db.query.appointmentTypes.findFirst({
        where: and(...conditions),
    });

    if (!result) {
        throw new NotFoundError('Appointment type');
    }

    return result;
}

/**
 * Update an appointment type
 */
export async function updateAppointmentType(
    id: string,
    ownerId: string,
    payload: UpdateAppointmentTypePayload
): Promise<AppointmentType> {
    // Verify ownership first
    const existing = await getAppointmentTypeById(id, ownerId);

    // Build update object, filtering out undefined values
    const updateData: Record<string, any> = {
        updatedAt: new Date(),
    };

    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.durationMinutes !== undefined) updateData.durationMinutes = payload.durationMinutes;
    if (payload.location !== undefined) updateData.location = payload.location;
    if (payload.assignmentType !== undefined) updateData.assignmentType = payload.assignmentType;
    if (payload.isPublished !== undefined) {
        console.log('🔍 DEBUG: Setting isPublished to:', payload.isPublished);
        updateData.isPublished = payload.isPublished;
    }
    if (payload.isPaid !== undefined) updateData.isPaid = payload.isPaid;
    if (payload.bookingFeeCents !== undefined) updateData.bookingFeeCents = payload.bookingFeeCents;
    if (payload.manageCapacity !== undefined) updateData.manageCapacity = payload.manageCapacity;
    if (payload.maxCapacity !== undefined) updateData.maxCapacity = payload.maxCapacity;
    if (payload.manualConfirmation !== undefined)
        updateData.manualConfirmation = payload.manualConfirmation;
    if (payload.cancellationHours !== undefined)
        updateData.cancellationHours = payload.cancellationHours;
    if (payload.slotCreationMode !== undefined)
        updateData.slotCreationMode = payload.slotCreationMode;
    if (payload.introMessage !== undefined) updateData.introMessage = payload.introMessage;
    if (payload.confirmationMessage !== undefined)
        updateData.confirmationMessage = payload.confirmationMessage;
    if (payload.imageUrl !== undefined) updateData.imageUrl = payload.imageUrl;

    console.log('🔍 DEBUG: Update data being sent to DB:', updateData);

    const [updated] = await db
        .update(appointmentTypes)
        .set(updateData)
        .where(and(eq(appointmentTypes.id, id), eq(appointmentTypes.ownerId, ownerId)))
        .returning();

    if (!updated) {
        throw new NotFoundError('Appointment type');
    }

    console.log('🔍 DEBUG: Updated record from DB:', updated);

    return updated;
}

/**
 * Publish an appointment type
 */
export async function publishAppointmentType(
    id: string,
    ownerId: string
): Promise<AppointmentType> {
    // Verify ownership and get current state
    const existing = await getAppointmentTypeById(id, ownerId);

    if (existing.isPublished) {
        throw new ValidationError('Appointment type is already published');
    }

    // Ensure there's at least one schedule before publishing
    const scheduleCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schedules)
        .where(eq(schedules.appointmentTypeId, id));

    if (scheduleCount[0].count === 0) {
        throw new ValidationError(
            'Cannot publish: Appointment type must have at least one schedule'
        );
    }

    const [updated] = await db
        .update(appointmentTypes)
        .set({
            isPublished: true,
            updatedAt: new Date(),
        })
        .where(and(eq(appointmentTypes.id, id), eq(appointmentTypes.ownerId, ownerId)))
        .returning();

    return updated;
}

/**
 * Unpublish an appointment type
 */
export async function unpublishAppointmentType(
    id: string,
    ownerId: string
): Promise<AppointmentType> {
    // Verify ownership
    const existing = await getAppointmentTypeById(id, ownerId);

    if (!existing.isPublished) {
        throw new ValidationError('Appointment type is already unpublished');
    }

    const [updated] = await db
        .update(appointmentTypes)
        .set({
            isPublished: false,
            updatedAt: new Date(),
        })
        .where(and(eq(appointmentTypes.id, id), eq(appointmentTypes.ownerId, ownerId)))
        .returning();

    return updated;
}

// ============================================
// QUESTIONS MANAGEMENT
// ============================================

/**
 * Get all questions for an appointment type
 */
export async function getQuestionsByAppointmentType(
    appointmentTypeId: string,
    ownerId: string
): Promise<Array<any>> {
    console.log('🔍 SERVICE: Getting questions for appointment:', appointmentTypeId, 'owner:', ownerId);

    // Verify ownership
    await getAppointmentTypeById(appointmentTypeId, ownerId);
    console.log('✅ SERVICE: Ownership verified');

    const { questions } = await import('../../db/schema');

    const appointmentQuestions = await db
        .select()
        .from(questions)
        .where(eq(questions.appointmentTypeId, appointmentTypeId))
        .orderBy(questions.sortOrder);

    console.log('📊 SERVICE: Found questions:', appointmentQuestions.length);
    console.log('📋 SERVICE: Questions data:', appointmentQuestions);

    return appointmentQuestions;
}

/**
 * Create multiple questions for an appointment type
 */
export async function createMultipleQuestions(
    appointmentTypeId: string,
    ownerId: string,
    questionsData: Array<{
        questionText: string;
        answerType: string;
        options?: string;
        isMandatory?: boolean;
        sortOrder?: number;
    }>
): Promise<Array<any>> {
    // Verify ownership
    await getAppointmentTypeById(appointmentTypeId, ownerId);

    const { questions } = await import('../../db/schema');
    const createdQuestions: any[] = [];
    const now = new Date();

    for (const questionData of questionsData) {
        const id = generateId();

        const [created] = await db
            .insert(questions)
            .values({
                id,
                appointmentTypeId,
                questionText: questionData.questionText,
                answerType: questionData.answerType,
                options: questionData.options ?? null,
                isMandatory: questionData.isMandatory ?? false,
                sortOrder: questionData.sortOrder ?? 0,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        createdQuestions.push(created);
    }

    return createdQuestions;
}

/**
 * Update a single question
 */
export async function updateQuestion(
    questionId: string,
    appointmentTypeId: string,
    ownerId: string,
    questionData: {
        questionText?: string;
        answerType?: string;
        options?: string | null;
        isMandatory?: boolean;
        sortOrder?: number;
    }
): Promise<any> {
    // Verify ownership
    await getAppointmentTypeById(appointmentTypeId, ownerId);

    const { questions } = await import('../../db/schema');
    const now = new Date();

    // Build update object with only defined values
    const updateData: Record<string, any> = { updatedAt: now };
    if (questionData.questionText !== undefined) updateData.questionText = questionData.questionText;
    if (questionData.answerType !== undefined) updateData.answerType = questionData.answerType;
    if (questionData.options !== undefined) updateData.options = questionData.options;
    if (questionData.isMandatory !== undefined) updateData.isMandatory = questionData.isMandatory;
    if (questionData.sortOrder !== undefined) updateData.sortOrder = questionData.sortOrder;

    const [updated] = await db
        .update(questions)
        .set(updateData)
        .where(and(eq(questions.id, questionId), eq(questions.appointmentTypeId, appointmentTypeId)))
        .returning();

    return updated;
}

/**
 * Delete a single question
 */
export async function deleteQuestion(
    questionId: string,
    appointmentTypeId: string,
    ownerId: string
): Promise<void> {
    // Verify ownership
    await getAppointmentTypeById(appointmentTypeId, ownerId);

    const { questions } = await import('../../db/schema');

    await db.delete(questions).where(and(eq(questions.id, questionId), eq(questions.appointmentTypeId, appointmentTypeId)));
}

/**
 * Get all resources linked to an appointment type
 */
export async function getResourcesByAppointmentType(
    appointmentTypeId: string,
    ownerId: string
): Promise<Array<{ id: string; name: string; type: string }>> {
    // Verify ownership
    await getAppointmentTypeById(appointmentTypeId, ownerId);

    const { resources, appointmentTypeResources } = await import('../../db/schema');

    // Get linked resources
    const linkedResources = await db
        .select({
            id: resources.id,
            name: resources.name,
            type: resources.type,
        })
        .from(appointmentTypeResources)
        .innerJoin(resources, eq(appointmentTypeResources.resourceId, resources.id))
        .where(eq(appointmentTypeResources.appointmentTypeId, appointmentTypeId));

    return linkedResources;
}

/**
 * Link resources to an appointment type
 */
export async function linkResources(
    appointmentTypeId: string,
    ownerId: string,
    resourceIds: string[]
): Promise<void> {
    // Verify ownership
    await getAppointmentTypeById(appointmentTypeId, ownerId);

    const { appointmentTypeResources } = await import('../../db/schema');
    const now = new Date();

    // Link each resource
    for (const resourceId of resourceIds) {
        // Check if link already exists
        const existing = await db
            .select()
            .from(appointmentTypeResources)
            .where(
                and(
                    eq(appointmentTypeResources.appointmentTypeId, appointmentTypeId),
                    eq(appointmentTypeResources.resourceId, resourceId)
                )
            )
            .limit(1);

        // Only insert if it doesn't exist
        if (existing.length === 0) {
            await db.insert(appointmentTypeResources).values({
                id: generateId(),
                appointmentTypeId,
                resourceId,
                createdAt: now,
            });
        }
    }
}

/**
 * Unlink a resource from an appointment type
 */
export async function unlinkResource(
    appointmentTypeId: string,
    resourceId: string,
    ownerId: string
): Promise<void> {
    // Verify ownership
    await getAppointmentTypeById(appointmentTypeId, ownerId);

    const { appointmentTypeResources } = await import('../../db/schema');

    await db
        .delete(appointmentTypeResources)
        .where(
            and(
                eq(appointmentTypeResources.appointmentTypeId, appointmentTypeId),
                eq(appointmentTypeResources.resourceId, resourceId)
            )
        );
}

// ============================================
// AVAILABILITY CALCULATION
// ============================================

/**
 * Get availability slots for a specific date
 * This is the core slot generation logic with SQL-based capacity calculation
 */
export async function getAvailability(
    appointmentTypeId: string,
    dateStr: string
): Promise<AvailabilitySlot[]> {
    // Fetch the appointment type
    const appointmentType = await db.query.appointmentTypes.findFirst({
        where: eq(appointmentTypes.id, appointmentTypeId),
    });

    if (!appointmentType) {
        throw new NotFoundError('Appointment type');
    }

    // Unpublished appointments return no availability
    if (!appointmentType.isPublished) {
        return [];
    }

    // Past dates return empty availability
    if (isDateInPast(dateStr)) {
        return [];
    }

    // Get day of week for the requested date
    const targetDate = new Date(dateStr);
    const dayOfWeek = getDayOfWeek(targetDate);

    // Fetch schedules for this appointment type on this day
    const daySchedules = await db.query.schedules.findMany({
        where: and(
            eq(schedules.appointmentTypeId, appointmentTypeId),
            eq(schedules.dayOfWeek, dayOfWeek)
        ),
    });

    // No schedules for this day means no availability
    if (daySchedules.length === 0) {
        return [];
    }

    // Generate slots based on schedules
    const slots: AvailabilitySlot[] = [];
    const durationMinutes = appointmentType.durationMinutes;
    const maxCapacity = appointmentType.manageCapacity ? (appointmentType.maxCapacity ?? 1) : 1;
    const now = new Date();

    for (const schedule of daySchedules) {
        const scheduleStartMinutes = parseTimeToMinutes(schedule.fromTime);
        const scheduleEndMinutes = parseTimeToMinutes(schedule.toTime);

        // Generate slots within this schedule window
        let currentSlotStart = scheduleStartMinutes;

        while (currentSlotStart + durationMinutes <= scheduleEndMinutes) {
            const slotStartDate = new Date(dateStr);
            const slotEndDate = new Date(dateStr);

            // Set slot times
            slotStartDate.setHours(
                Math.floor(currentSlotStart / 60),
                currentSlotStart % 60,
                0,
                0
            );
            slotEndDate.setHours(
                Math.floor((currentSlotStart + durationMinutes) / 60),
                (currentSlotStart + durationMinutes) % 60,
                0,
                0
            );

            // Skip slots in the past (for today)
            if (slotStartDate <= now) {
                currentSlotStart += durationMinutes;
                continue;
            }

            // Use SQL to count total people booked in this specific time slot
            // A booking overlaps if: booking.startTime < slotEnd AND booking.endTime > slotStart
            const bookedCountResult = await db
                .select({
                    totalPeople: sql<number>`COALESCE(SUM(${bookings.numPeople}), 0)::int`
                })
                .from(bookings)
                .where(
                    and(
                        eq(bookings.appointmentTypeId, appointmentTypeId),
                        // Overlap condition: booking overlaps with this slot
                        lt(bookings.startTime, slotEndDate),
                        gt(bookings.endTime, slotStartDate),
                        // Only count active bookings
                        or(
                            eq(bookings.status, 'request'),
                            eq(bookings.status, 'booked'),
                            eq(bookings.status, 'pending'),
                            eq(bookings.status, 'confirmed')
                        )
                    )
                );

            const bookedCount = bookedCountResult[0]?.totalPeople || 0;
            const remainingCapacity = maxCapacity - bookedCount;
            const isAvailable = remainingCapacity > 0;

            slots.push({
                startTime: slotStartDate.toISOString(),
                endTime: slotEndDate.toISOString(),
                available: isAvailable,
                remainingCapacity: Math.max(0, remainingCapacity),
            });

            currentSlotStart += durationMinutes;
        }
    }

    // Sort slots by start time
    slots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return slots;
}

// ============================================
// PUBLIC ENDPOINTS (No Auth Required)
// ============================================

/**
 * Get all published appointment types for public browsing
 */
export async function getPublicAppointmentTypes(
    options: { page: number; limit: number; search?: string | undefined; isPaid?: boolean | undefined }
): Promise<{ data: AppointmentType[]; total: number }> {
    const { page, limit, search, isPaid } = options;
    const offset = (page - 1) * limit;

    // Build where conditions - only published appointments
    let whereClause = eq(appointmentTypes.isPublished, true);

    // Get total count
    const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(appointmentTypes)
        .where(whereClause);
    const count = countResult[0]?.count ?? 0;

    // Get paginated results with optional search
    let query = db.query.appointmentTypes.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (appointmentTypes, { desc }) => [desc(appointmentTypes.createdAt)],
    });

    let results = await query;

    // Apply search filter in memory (for simplicity)
    if (search) {
        const searchLower = search.toLowerCase();
        results = results.filter(
            (apt) =>
                apt.title.toLowerCase().includes(searchLower) ||
                apt.description?.toLowerCase().includes(searchLower)
        );
    }

    // Apply isPaid filter
    if (isPaid !== undefined) {
        results = results.filter((apt) => apt.isPaid === isPaid);
    }

    return { data: results, total: count };
}

/**
 * Get a single published appointment type with resources and questions
 */
export async function getPublicAppointmentTypeById(id: string): Promise<{
    appointment: AppointmentType;
    resources: Array<{ id: string; name: string; type: string }>;
    questions: Array<{ id: string; questionText: string; answerType: string; isMandatory: boolean; sortOrder: number; options?: string }>;
}> {
    const appointment = await db.query.appointmentTypes.findFirst({
        where: and(eq(appointmentTypes.id, id), eq(appointmentTypes.isPublished, true)),
    });

    if (!appointment) {
        throw new NotFoundError('Appointment type not found or not published');
    }

    // Import resources and questions tables
    const { resources, appointmentTypeResources, questions } = await import('../../db/schema');

    // Get linked resources
    const linkedResources = await db
        .select({
            id: resources.id,
            name: resources.name,
            type: resources.type,
        })
        .from(appointmentTypeResources)
        .innerJoin(resources, eq(appointmentTypeResources.resourceId, resources.id))
        .where(eq(appointmentTypeResources.appointmentTypeId, id));

    // Get questions for this appointment type
    const appointmentQuestions = await db
        .select({
            id: questions.id,
            questionText: questions.questionText,
            answerType: questions.answerType,
            isMandatory: questions.isMandatory,
            sortOrder: questions.sortOrder,
            options: questions.options,
        })
        .from(questions)
        .where(eq(questions.appointmentTypeId, id))
        .orderBy(questions.sortOrder);

    return {
        appointment,
        resources: linkedResources,
        questions: appointmentQuestions.map(q => ({
            ...q,
            isMandatory: q.isMandatory ?? false,
            sortOrder: q.sortOrder ?? 0,
            options: q.options ?? undefined,
        })),
    };
}

// ============================================
// COMMENTS
// ============================================

/**
 * Add a comment to an appointment type
 */
export async function addComment(
    appointmentTypeId: string,
    userId: string,
    message: string,
    parentId?: string | null
): Promise<any> {
    const { comments } = await import('../../db/schema');
    const id = crypto.randomUUID();
    const now = new Date();

    const [comment] = await db
        .insert(comments)
        .values({
            id,
            appointmentTypeId,
            ownerId: userId,
            message,
            parentId: parentId ?? null,
            createdAt: now,
            updatedAt: now,
        })
        .returning();

    return comment;
}

/**
 * Get comments for an appointment type
 */
export async function getComments(appointmentTypeId: string): Promise<any[]> {
    const { comments, users } = await import('../../db/schema');

    const thread = await db
        .select({
            id: comments.id,
            message: comments.message,
            createdAt: comments.createdAt,
            parentId: comments.parentId,
            ownerId: comments.ownerId,
            authorName: users.name,
            authorImage: users.image,
        })
        .from(comments)
        .leftJoin(users, eq(comments.ownerId, users.id))
        .where(eq(comments.appointmentTypeId, appointmentTypeId))
        .orderBy(desc(comments.createdAt));

    return thread;
}


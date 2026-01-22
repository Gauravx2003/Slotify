/**
 * Appointment Types Module - Controller Layer
 * Handles HTTP request/response for appointment type endpoints
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { asyncHandler, NotFoundError, AuthorizationError, ValidationError } from '../../utils/error';
import { successResponse, paginatedResponse, PaginationMeta } from '../../utils/response';
import * as appointmentsService from './appointments.service';
import { s3Helpers } from '../../config/s3';

/**
 * POST /appointments
 * Create a new appointment type
 */
export const createAppointmentType = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    const appointmentType = await appointmentsService.createAppointmentType(userId, req.body);

    res.status(201).json(
        successResponse(appointmentType, 'Appointment type created successfully')
    );
});

/**
 * GET /appointments
 * List appointment types for the authenticated user
 */
export const getAppointmentTypes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    // Use validated query from middleware (res.locals.validatedQuery) or fallback to req.query
    const { page = 1, limit = 20, isPublished } = (res.locals.validatedQuery || req.query) as {
        page: number;
        limit: number;
        isPublished?: boolean;
    };

    const { data, total } = await appointmentsService.getAppointmentTypes(userId, {
        page,
        limit,
        isPublished,
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

    res.json(paginatedResponse(data, pagination));
});

/**
 * GET /appointments/:id
 * Get a single appointment type by ID
 */
export const getAppointmentTypeById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    const { id } = req.params;
    const appointmentType = await appointmentsService.getAppointmentTypeById(id, userId);

    res.json(successResponse(appointmentType));
});

/**
 * PATCH /appointments/:id
 * Update an appointment type
 */
export const updateAppointmentType = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    const { id } = req.params;
    console.log('🔍 DEBUG: Request body received:', req.body);
    console.log('🔍 DEBUG: isPublished in body?', req.body.isPublished);

    const updated = await appointmentsService.updateAppointmentType(id, userId, req.body);

    res.json(successResponse(updated, 'Appointment type updated successfully'));
});

/**
 * POST /appointments/:id/publish
 * Publish an appointment type
 */
export const publishAppointmentType = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    const { id } = req.params;
    const published = await appointmentsService.publishAppointmentType(id, userId);

    res.json(successResponse(published, 'Appointment type published successfully'));
});

/**
 * POST /appointments/:id/unpublish
 * Unpublish an appointment type
 */
export const unpublishAppointmentType = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    const { id } = req.params;
    const unpublished = await appointmentsService.unpublishAppointmentType(id, userId);

    res.json(successResponse(unpublished, 'Appointment type unpublished successfully'));
});

/**
 * GET /appointments/:id/availability?date=YYYY-MM-DD
 * Get available time slots for a specific date
 */
export const getAvailability = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    // Use validated query from middleware or fallback to req.query
    const { date } = (res.locals.validatedQuery || req.query) as { date: string };

    const slots = await appointmentsService.getAvailability(id, date);

    res.json(
        successResponse(
            {
                appointmentTypeId: id,
                date,
                slots,
                totalSlots: slots.length,
                availableSlots: slots.filter((s) => s.available).length,
            },
            'Availability retrieved successfully'
        )
    );
});

/**
 * GET /appointments/:id/questions
 * Get all questions for an appointment type
 */
export const getQuestions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    const { id: appointmentTypeId } = req.params;

    const questions = await appointmentsService.getQuestionsByAppointmentType(
        appointmentTypeId,
        userId
    );

    res.json(successResponse(questions, 'Questions retrieved successfully'));
});

/**
 * POST /appointments/:id/questions
 * Create multiple questions for an appointment type
 */
export const createQuestions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    const { id: appointmentTypeId } = req.params;
    const { questions } = req.body;

    if (!Array.isArray(questions)) {
        throw new Error('Questions must be an array');
    }

    const createdQuestions = await appointmentsService.createMultipleQuestions(
        appointmentTypeId,
        userId,
        questions
    );

    res.status(201).json(successResponse(createdQuestions, 'Questions created successfully'));
});

/**
 * PATCH /appointments/:id/questions/:questionId
 * Update a single question
 */
export const updateQuestion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    const { id: appointmentTypeId, questionId } = req.params;
    const questionData = req.body;

    const updatedQuestion = await appointmentsService.updateQuestion(
        questionId,
        appointmentTypeId,
        userId,
        questionData
    );

    res.json(successResponse(updatedQuestion, 'Question updated successfully'));
});

/**
 * DELETE /appointments/:id/questions/:questionId
 * Delete a single question
 */
export const deleteQuestion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    const { id: appointmentTypeId, questionId } = req.params;

    await appointmentsService.deleteQuestion(
        questionId,
        appointmentTypeId,
        userId
    );

    res.json(successResponse(null, 'Question deleted successfully'));
});

/**
 * GET /appointments/:id/resources
 * Get all resources linked to an appointment type
 */
export const getResources = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    const { id: appointmentTypeId } = req.params;

    const resources = await appointmentsService.getResourcesByAppointmentType(
        appointmentTypeId,
        userId
    );

    res.json(successResponse(resources, 'Resources retrieved successfully'));
});

/**
 * POST /appointments/:id/resources
 * Link resources to an appointment type
 */
export const linkResources = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    const { id: appointmentTypeId } = req.params;
    const { resourceIds } = req.body;

    if (!Array.isArray(resourceIds)) {
        throw new ValidationError('resourceIds must be an array');
    }

    await appointmentsService.linkResources(appointmentTypeId, userId, resourceIds);

    res.status(201).json(successResponse(null, 'Resources linked successfully'));
});

/**
 * DELETE /appointments/:id/resources/:resourceId
 * Unlink a resource from an appointment type
 */
export const unlinkResource = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    const { id: appointmentTypeId, resourceId } = req.params;

    await appointmentsService.unlinkResource(appointmentTypeId, resourceId, userId);

    res.json(successResponse(null, 'Resource unlinked successfully'));
});

// ============================================
// PUBLIC ENDPOINTS (No Auth Required)
// ============================================

/**
 * GET /appointments/public
 * List all published appointment types (public access)
 */
export const getPublicAppointmentTypes = asyncHandler(async (req: any, res: Response) => {
    const { page = 1, limit = 20, search, isPaid } = req.query as {
        page?: number;
        limit?: number;
        search?: string;
        isPaid?: string;
    };

    const { data, total } = await appointmentsService.getPublicAppointmentTypes({
        page: Number(page),
        limit: Number(limit),
        search,
        isPaid: isPaid === 'true' ? true : isPaid === 'false' ? false : undefined,
    });

    const totalPages = Math.ceil(total / Number(limit));
    const pagination: PaginationMeta = {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1,
    };

    res.json(paginatedResponse(data, pagination));
});

/**
 * GET /appointments/public/:id
 * Get a single published appointment type with resources and questions
 */
export const getPublicAppointmentTypeById = asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const result = await appointmentsService.getPublicAppointmentTypeById(id);

    res.json(
        successResponse({
            ...result.appointment,
            resources: result.resources,
            questions: result.questions,
        })
    );
});

/**
 * GET /appointments/public/:id/availability
 * Get available time slots for a specific date (public access)
 */
export const getPublicAvailability = asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const { date } = req.query as { date: string };

    if (!date) {
        throw new NotFoundError('Date query parameter is required');
    }

    const slots = await appointmentsService.getAvailability(id, date);

    res.json(
        successResponse(
            {
                appointmentTypeId: id,
                date,
                slots,
                totalSlots: slots.length,
                availableSlots: slots.filter((s) => s.available).length,
            },
            'Availability retrieved successfully'
        )
    );
});

/**
 * POST /appointments/:id/image
 * Upload an image for an appointment type
 */
export const uploadAppointmentImage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    const { id } = req.params;

    if (!req.file) {
        throw new ValidationError('No file uploaded');
    }

    // Verify ownership
    const appointment = await appointmentsService.getAppointmentTypeById(id, userId);

    // Delete old image if exists
    if (appointment.imageUrl) {
        try {
            await s3Helpers.deleteFile(appointment.imageUrl);
        } catch (error) {
            console.error('Error deleting old appointment image:', error);
            // Continue even if deletion fails
        }
    }

    // Upload new image
    const imageUrl = await s3Helpers.uploadAppointmentImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        id
    );

    // Update appointment with new image URL
    const updated = await appointmentsService.updateAppointmentType(id, userId, { imageUrl });

    res.json(successResponse(updated, 'Appointment image uploaded successfully'));
});

/**
 * DELETE /appointments/:id/image
 * Delete the image for an appointment type
 */
export const deleteAppointmentImage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    const { id } = req.params;

    // Verify ownership and get current appointment
    const appointment = await appointmentsService.getAppointmentTypeById(id, userId);

    if (!appointment.imageUrl) {
        throw new ValidationError('No image to delete');
    }

    // Delete from S3
    await s3Helpers.deleteFile(appointment.imageUrl);

    // Update appointment to remove image URL
    const updated = await appointmentsService.updateAppointmentType(id, userId, { imageUrl: null });

    res.json(successResponse(updated, 'Appointment image deleted successfully'));
});


// ============================================
// COMMENTS
// ============================================

/**
 * POST /appointments/:id/comments
 * Add a comment to an appointment type
 */
export const addComment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AuthorizationError('User not authenticated');
    }

    const { id: appointmentTypeId } = req.params;
    const { message, parentId } = req.body;

    if (!message) {
        throw new ValidationError('Message is required');
    }

    const comment = await appointmentsService.addComment(
        appointmentTypeId,
        userId,
        message,
        parentId
    );

    res.status(201).json(successResponse(comment, 'Comment added successfully'));
});

/**
 * GET /appointments/:id/comments
 * Get all comments for an appointment type
 */
export const getCommentsForAppointment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id: appointmentTypeId } = req.params;

    const comments = await appointmentsService.getComments(appointmentTypeId);

    res.json(successResponse(comments, 'Comments retrieved successfully'));
});

/**
 * Appointment Types Module - Routes
 */

import { Router } from 'express';
import * as appointmentsController from './appointments.controller';
import * as schedulesController from '../schedules/schedules.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import {
    createAppointmentTypeSchema,
    updateAppointmentTypeSchema,
    availabilityQuerySchema,
    idParamSchema,
    questionIdParamSchema,
    listQuerySchema,
} from './appointments.validator';

const router = Router();

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

/**
 * @route   GET /api/appointments/public
 * @desc    List all published appointment types for public browsing
 * @access  Public
 */
router.get('/public', appointmentsController.getPublicAppointmentTypes);

/**
 * @route   GET /api/appointments/public/:id
 * @desc    Get a single published appointment type with resources and questions
 * @access  Public
 */
router.get('/public/:id', appointmentsController.getPublicAppointmentTypeById);

/**
 * @route   GET /api/appointments/public/:id/availability
 * @desc    Get available time slots for a specific date
 * @access  Public
 */
router.get('/public/:id/availability', appointmentsController.getPublicAvailability);

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

// All routes below require authentication
router.use(authenticate);

/**
 * @route   POST /api/appointments
 * @desc    Create a new appointment type
 * @access  Private (Organiser)
 */
router.post(
    '/',
    validateBody(createAppointmentTypeSchema),
    appointmentsController.createAppointmentType
);

/**
 * @route   GET /api/appointments
 * @desc    List appointment types for the current user
 * @access  Private
 */
router.get('/', validateQuery(listQuerySchema), appointmentsController.getAppointmentTypes);

/**
 * @route   GET /api/appointments/:id
 * @desc    Get a single appointment type
 * @access  Private
 */
router.get('/:id', validateParams(idParamSchema), appointmentsController.getAppointmentTypeById);

/**
 * @route   PATCH /api/appointments/:id
 * @desc    Update an appointment type
 * @access  Private (Owner only)
 */
router.patch(
    '/:id',
    validateParams(idParamSchema),
    validateBody(updateAppointmentTypeSchema),
    appointmentsController.updateAppointmentType
);

/**
 * @route   POST /api/appointments/:id/publish
 * @desc    Publish an appointment type
 * @access  Private (Owner only)
 */
router.post(
    '/:id/publish',
    validateParams(idParamSchema),
    appointmentsController.publishAppointmentType
);

/**
 * @route   POST /api/appointments/:id/unpublish
 * @desc    Unpublish an appointment type
 * @access  Private (Owner only)
 */
router.post(
    '/:id/unpublish',
    validateParams(idParamSchema),
    appointmentsController.unpublishAppointmentType
);

/**
 * @route   GET /api/appointments/:id/availability
 * @desc    Get available time slots for a specific date
 * @access  Private
 */
router.get(
    '/:id/availability',
    validateParams(idParamSchema),
    validateQuery(availabilityQuerySchema),
    appointmentsController.getAvailability
);

/**
 * @route   GET /api/appointments/:id/schedules
 * @desc    Get all schedules for an appointment type
 * @access  Private (Owner only)
 */
router.get(
    '/:id/schedules',
    validateParams(idParamSchema),
    schedulesController.getSchedulesByAppointmentType
);

/**
 * POST /api/appointments/:id/schedules
 * @desc    Create schedules for an appointment type
 * @access  Private (Owner only)
 */
router.post(
    '/:id/schedules',
    validateParams(idParamSchema),
    schedulesController.createSchedules
);

/**
 * @route   POST /api/appointments/:id/resources
 * @desc    Link resources to an appointment type
 * @access  Private (Owner only)
 */
router.post(
    '/:id/resources',
    validateParams(idParamSchema),
    appointmentsController.linkResources
);

/**
 * @route   DELETE /api/appointments/:id/resources/:resourceId
 * @desc    Unlink a resource from an appointment type
 * @access  Private (Owner only)
 */
router.delete(
    '/:id/resources/:resourceId',
    validateParams(idParamSchema),
    appointmentsController.unlinkResource
);

/**
 * @route   GET /api/appointments/:id/questions
 * @desc    Get all questions for an appointment type
 * @access  Private (Owner only)
 */
router.get(
    '/:id/questions',
    validateParams(idParamSchema),
    appointmentsController.getQuestions
);

/**
 * @route   POST /api/appointments/:id/questions
 * @desc    Create questions for an appointment type
 * @access  Private (Owner only)
 */
router.post(
    '/:id/questions',
    validateParams(idParamSchema),
    appointmentsController.createQuestions
);

/**
 * @route   PATCH /api/appointments/:id/questions/:questionId
 * @desc    Update a single question
 * @access  Private (Owner only)
 */
router.patch(
    '/:id/questions/:questionId',
    validateParams(questionIdParamSchema),
    appointmentsController.updateQuestion
);

/**
 * @route   DELETE /api/appointments/:id/questions/:questionId
 * @desc    Delete a single question
 * @access  Private (Owner only)
 */
router.delete(
    '/:id/questions/:questionId',
    validateParams(questionIdParamSchema),
    appointmentsController.deleteQuestion
);

/**
 * @route   GET /api/appointments/:id/resources
 * @desc    Get all resources linked to an appointment type
 * @access  Private (Owner only)
 */
router.get(
    '/:id/resources',
    validateParams(idParamSchema),
    appointmentsController.getResources
);

// Comments
router.post('/:id/comments', appointmentsController.addComment);
router.get('/:id/comments', appointmentsController.getCommentsForAppointment);

export const appointmentsRoutes = router;

import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Note: Most auth routes are now handled by Better Auth at /api/auth/*
// These are additional custom endpoints

/**
 * @route   GET /api/auth/me
 * @desc    Get current user (custom route for additional user data)
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, authController.updateProfile);

export default router;

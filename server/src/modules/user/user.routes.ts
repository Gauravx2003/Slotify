import { Router } from 'express';
import * as userController from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import { updateUserSchema } from '../auth/auth.validator';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile (name, email)
 * @access  Private
 */
router.put('/profile', validateBody(updateUserSchema), userController.updateProfile);

/**
 * @route   POST /api/user/profile-picture
 * @desc    Upload profile picture
 * @access  Private
 */
router.post('/profile-picture', uploadSingle('profilePicture'), userController.uploadProfilePicture);

/**
 * @route   DELETE /api/user/profile-picture
 * @desc    Delete profile picture
 * @access  Private
 */
router.delete('/profile-picture', userController.deleteProfilePicture);

/**
 * @route   DELETE /api/user/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', userController.deleteAccount);

export default router;

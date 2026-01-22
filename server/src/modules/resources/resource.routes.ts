import { Router } from 'express';
import { ResourceController } from './resource.controller';
import { ResourceValidator } from './resource.validator';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new ResourceController();
const validator = new ResourceValidator();

// All resource routes require authentication
router.use(authenticate);

// Get all resources for the authenticated organizer
router.get('/', controller.getResources);

// Get a single resource by ID
router.get('/:id', controller.getResourceById);

// Create a new resource
router.post('/', validator.validateCreate, controller.createResource);

// Update a resource
router.patch('/:id', validator.validateUpdate, controller.updateResource);

// Delete a resource
router.delete('/:id', controller.deleteResource);

export default router;

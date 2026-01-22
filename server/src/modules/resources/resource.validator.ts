import { Request, Response, NextFunction } from 'express';

export class ResourceValidator {
    validateCreate = (req: Request, res: Response, next: NextFunction) => {
        const { name, type } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Name is required and must be a non-empty string',
            });
        }

        if (!type || !['user', 'resource'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type is required and must be either "user" or "resource"',
            });
        }

        if (req.body.capacity !== undefined) {
            const capacity = parseInt(req.body.capacity);
            if (isNaN(capacity) || capacity < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Capacity must be a positive number',
                });
            }
        }

        if (req.body.email && typeof req.body.email !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Email must be a string',
            });
        }

        next();
    };

    validateUpdate = (req: Request, res: Response, next: NextFunction) => {
        if (req.body.name !== undefined) {
            if (typeof req.body.name !== 'string' || req.body.name.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Name must be a non-empty string',
                });
            }
        }

        if (req.body.type !== undefined) {
            if (!['user', 'resource'].includes(req.body.type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Type must be either "user" or "resource"',
                });
            }
        }

        if (req.body.capacity !== undefined) {
            const capacity = parseInt(req.body.capacity);
            if (isNaN(capacity) || capacity < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Capacity must be a positive number',
                });
            }
        }

        next();
    };
}

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/error';

/**
 * Validate request body against a Zod schema
 */
export const validateBody = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            // Handle undefined/null body - treat as empty object
            // This allows PATCH requests with optional fields to work
            const bodyData = req.body ?? {};
            const validated = schema.parse(bodyData);
            req.body = validated;
            next();
        } catch (error) {
            // Pass all errors to the global error handler
            next(error);
        }
    };
};

/**
 * Validate request query parameters against a Zod schema
 * Note: In Express 5, req.query is read-only, so we store validated data in res.locals.query
 */
export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            // Ensure req.query is at least an empty object
            const queryData = req.query || {};
            const validated = schema.parse(queryData);
            // Store validated query in res.locals for controller access
            res.locals.validatedQuery = validated;
            next();
        } catch (error) {
            // Pass all errors to the global error handler
            next(error);
        }
    };
};

/**
 * Validate request params against a Zod schema
 */
export const validateParams = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const validated = schema.parse(req.params);
            req.params = validated as any;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                next(error);
            } else {
                next(new ValidationError('Params validation failed'));
            }
        }
    };
};

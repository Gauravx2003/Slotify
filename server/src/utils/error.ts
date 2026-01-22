import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Custom error types
export enum ErrorType {
    VALIDATION = 'VALIDATION_ERROR',
    DATABASE = 'DATABASE_ERROR',
    AUTHENTICATION = 'AUTHENTICATION_ERROR',
    AUTHORIZATION = 'AUTHORIZATION_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    REDIS = 'REDIS_ERROR',
    S3 = 'S3_ERROR',
    BAD_REQUEST = 'BAD_REQUEST',
    INTERNAL = 'INTERNAL_ERROR',
    CONFLICT = 'CONFLICT',
    RATE_LIMIT = 'RATE_LIMIT_ERROR',
}

export class AppError extends Error {
    public statusCode: number;
    public errorType: ErrorType;
    public isOperational: boolean;
    public details?: any;

    constructor(
        message: string,
        statusCode: number = 500,
        errorType: ErrorType = ErrorType.INTERNAL,
        details?: any
    ) {
        super(message);
        this.statusCode = statusCode;
        this.errorType = errorType;
        this.isOperational = true;
        this.details = details;

        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

// Specific error classes
export class ValidationError extends AppError {
    constructor(message: string, details?: any) {
        super(message, 400, ErrorType.VALIDATION, details);
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication failed') {
        super(message, 401, ErrorType.AUTHENTICATION);
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = 'You do not have permission to perform this action') {
        super(message, 403, ErrorType.AUTHORIZATION);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404, ErrorType.NOT_FOUND);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, ErrorType.CONFLICT);
    }
}

export class BadRequestError extends AppError {
    constructor(message: string, details?: any) {
        super(message, 400, ErrorType.BAD_REQUEST, details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized access') {
        super(message, 401, ErrorType.AUTHENTICATION);
    }
}

export class DatabaseError extends AppError {
    constructor(message: string, details?: any) {
        super(message, 500, ErrorType.DATABASE, details);
    }
}

export class RedisError extends AppError {
    constructor(message: string, details?: any) {
        super(message, 500, ErrorType.REDIS, details);
    }
}

export class S3Error extends AppError {
    constructor(message: string, details?: any) {
        super(message, 500, ErrorType.S3, details);
    }
}

export class RateLimitError extends AppError {
    constructor(message: string = 'Too many requests, please try again later') {
        super(message, 429, ErrorType.RATE_LIMIT);
    }
}

// Error response interface
interface ErrorResponse {
    success: false;
    error: {
        type: ErrorType;
        message: string;
        statusCode: number;
        details?: any;
        stack?: string;
    };
}

/**
 * Global error handler middleware
 * This handles ALL types of errors in the application
 */
export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.error('❌ Error:', {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });

    // Default error response
    let statusCode = 500;
    let errorType = ErrorType.INTERNAL;
    let message = 'An unexpected error occurred';
    let details: any = undefined;

    // Handle AppError and its subclasses
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        errorType = err.errorType;
        message = err.message;
        details = err.details;
    }
    // Handle Zod validation errors
    else if (err instanceof ZodError) {
        statusCode = 400;
        errorType = ErrorType.VALIDATION;
        message = 'Validation failed';
        details = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
    }
    // Handle PostgreSQL/Database errors
    else if (err.name === 'PostgresError' || (err as any).code?.startsWith?.('23')) {
        statusCode = 500;
        errorType = ErrorType.DATABASE;

        const pgError = err as any;

        // Unique constraint violation
        if (pgError.code === '23505') {
            statusCode = 409;
            errorType = ErrorType.CONFLICT;
            message = 'A record with this value already exists';

            // Extract field name from constraint
            const match = pgError.detail?.match(/Key \(([^)]+)\)/);
            if (match) {
                details = { field: match[1] };
                message = `${match[1]} already exists`;
            }
        }
        // Foreign key violation
        else if (pgError.code === '23503') {
            message = 'Referenced record does not exist';
        }
        // Not null violation
        else if (pgError.code === '23502') {
            message = 'Required field is missing';
            details = { field: pgError.column };
        }
        else {
            message = 'Database operation failed';
            details = process.env.NODE_ENV === 'development' ? { code: pgError.code } : undefined;
        }
    }
    // Handle Redis errors
    else if (err.message?.toLowerCase().includes('redis')) {
        statusCode = 500;
        errorType = ErrorType.REDIS;
        message = 'Cache operation failed';
    }
    // Handle S3 errors
    else if (err.name?.includes('S3') || err.message?.toLowerCase().includes('s3')) {
        statusCode = 500;
        errorType = ErrorType.S3;
        message = 'File storage operation failed';
    }
    // Handle JSON parsing errors
    else if (err instanceof SyntaxError && 'body' in err) {
        statusCode = 400;
        errorType = ErrorType.BAD_REQUEST;
        message = 'Invalid JSON payload';
    }
    // Handle multer file upload errors
    else if (err.name === 'MulterError') {
        statusCode = 400;
        errorType = ErrorType.VALIDATION;
        const multerErr = err as any;

        if (multerErr.code === 'LIMIT_FILE_SIZE') {
            message = 'File size exceeds the maximum allowed limit';
        } else if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Unexpected file field';
        } else {
            message = 'File upload failed';
        }
    }
    // Handle JWT errors
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorType = ErrorType.AUTHENTICATION;
        message = 'Invalid authentication token';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        errorType = ErrorType.AUTHENTICATION;
        message = 'Authentication token has expired';
    }

    // Build error response
    const errorResponse: ErrorResponse = {
        success: false,
        error: {
            type: errorType,
            message,
            statusCode,
            ...(details && { details }),
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    };

    res.status(statusCode).json(errorResponse);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    next(new NotFoundError(`Route ${req.originalUrl}`));
};

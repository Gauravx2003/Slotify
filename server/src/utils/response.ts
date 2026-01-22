/**
 * Standardized API Response Structure
 * All API responses should follow this format for consistency
 */

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: {
        type: string;
        message: string;
        details?: any;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
        [key: string]: any;
    };
}

/**
 * Create a success response
 */
export function successResponse<T>(
    data?: T,
    message?: string,
    meta?: Record<string, any>
): ApiResponse<T> {
    return {
        success: true,
        ...(message && { message }),
        ...(data !== undefined && { data }),
        ...(meta && {
            meta: {
                timestamp: new Date().toISOString(),
                ...meta,
            },
        }),
    };
}

/**
 * Create an error response
 */
export function errorResponse(
    message: string,
    type: string = 'ERROR',
    details?: any,
    meta?: Record<string, any>
): ApiResponse {
    return {
        success: false,
        error: {
            type,
            message,
            ...(details && { details }),
        },
        ...(meta && {
            meta: {
                timestamp: new Date().toISOString(),
                ...meta,
            },
        }),
    };
}

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
    data: T[],
    pagination: PaginationMeta,
    message?: string
): ApiResponse<T[]> {
    return {
        success: true,
        ...(message && { message }),
        data,
        meta: {
            timestamp: new Date().toISOString(),
            pagination,
        },
    };
}

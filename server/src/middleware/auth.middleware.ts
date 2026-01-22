import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/auth';
import { AuthenticationError } from '../utils/error';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
    };
    session?: {
        id: string;
        userId: string;
        expiresAt: Date;
    };
}

/**
 * Authentication middleware
 * Validates session from cookies (Better Auth) and attaches user to request
 */
export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get session using Better Auth (works with cookies)
        const session = await auth.api.getSession({
            headers: req.headers as any,
        });

        if (!session || !session.user) {
            throw new AuthenticationError('Not authenticated. Please log in.');
        }

        // Attach user and session to request
        req.user = session.user as any;
        req.session = session.session as any;

        next();
    } catch (error) {
        if (error instanceof AuthenticationError) {
            next(error);
        } else {
            next(new AuthenticationError('Authentication failed'));
        }
    }
};

/**
 * Optional authentication middleware
 * Attaches user if Bearer token exists, but doesn't throw error if not
 */
export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Check if Authorization header exists
        const authHeader = req.headers.authorization;

        // Only try to get session if Bearer token is present
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const session = await auth.api.getSession({
                headers: req.headers as any,
            });

            if (session) {
                req.user = session.user as any;
                req.session = session.session as any;
            }
        }

        next();
    } catch (error) {
        // Don't throw error for optional auth
        next();
    }
};

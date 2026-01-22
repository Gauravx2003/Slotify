/**
 * Shared types between frontend and backend
 * These types ensure type safety across the stack
 */

// ============================================
// API Response Structure
// ============================================

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

// ============================================
// User & Auth Types
// ============================================

export interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    role: 'customer' | 'admin' | 'organiser';
    isActive: boolean;
    phone?: string | null;
    image?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Session {
    id: string;
    userId: string;
    token: string;
    expiresAt: string;
    ipAddress?: string;
    userAgent?: string;
}

// ============================================
// Auth Request/Response Types
// ============================================

export interface SignupRequest {
    name: string;
    email: string;
    password: string;
    role: 'customer' | 'organiser';
}

export interface SignupResponse {
    user: Partial<User>;
    message: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    session: Session;
}

export interface VerifyOTPRequest {
    email: string;
    otp: string;
}

export interface VerifyOTPResponse {
    user: User;
    session?: Session;
}

export interface SendOTPRequest {
    email: string;
    type: 'sign-in' | 'email-verification' | 'forget-password';
}

export interface SendOTPResponse {
    message: string;
}

export interface ResetPasswordRequest {
    email: string;
    otp: string;
    newPassword: string;
}

export interface ResetPasswordResponse {
    message: string;
}

// ============================================
// Validation Schemas (for frontend)
// ============================================

export const PASSWORD_REGEX = {
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    number: /[0-9]/,
    special: /[!@#$%^&*(),.?":{}|<>]/,
};

export const PASSWORD_MIN_LENGTH = 8;

export function validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (password.length < PASSWORD_MIN_LENGTH) {
        errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }
    if (!PASSWORD_REGEX.uppercase.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!PASSWORD_REGEX.lowercase.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!PASSWORD_REGEX.number.test(password)) {
        errors.push('Password must contain at least one number');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

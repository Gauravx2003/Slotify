import { randomBytes } from 'crypto';

/**
 * Generate a unique ID with a prefix
 * @param prefix - Prefix for the ID (e.g., 'user', 'appointment', 'booking')
 * @returns A unique ID string
 */
export function generateId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const randomPart = randomBytes(8).toString('hex');
    return `${prefix}_${timestamp}${randomPart}`;
}

/**
 * Generate a random token
 * @param length - Length of the token (default: 32)
 * @returns A random token string
 */
export function generateToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
}

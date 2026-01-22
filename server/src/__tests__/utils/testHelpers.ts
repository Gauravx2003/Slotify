import { db } from '../../db';
import { users, sessions, passwordResetTokens } from '../../db/schema';
import { redisClient } from '../../config/redis';

/**
 * Clear all test data from the database
 */
export async function clearDatabase() {
    try {
        await db.delete(passwordResetTokens);
        await db.delete(sessions);
        await db.delete(users);
    } catch (error) {
        console.error('Error clearing database:', error);
    }
}

/**
 * Clear all test data from Redis
 */
export async function clearRedis() {
    try {
        await redisClient.flushDb();
    } catch (error) {
        console.error('Error clearing Redis:', error);
    }
}

/**
 * Setup test environment before tests
 */
export async function setupTests() {
    await clearDatabase();
    await clearRedis();
}

/**
 * Cleanup test environment after tests
 */
export async function teardownTests() {
    await clearDatabase();
    await clearRedis();
}

/**
 * Generate a random email for testing
 */
export function generateTestEmail(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generate a valid test password
 */
export function generateTestPassword(): string {
    return 'Test1234!';
}

/**
 * Create a test user data object
 */
export function createTestUserData(overrides: any = {}) {
    return {
        name: 'Test User',
        email: generateTestEmail(),
        password: generateTestPassword(),
        ...overrides,
    };
}

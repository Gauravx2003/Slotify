import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisConfig: any = {
    url: redisUrl,
    database: Number(process.env.REDIS_DB) || 0,
};

if (process.env.REDIS_PASSWORD) {
    redisConfig.password = process.env.REDIS_PASSWORD;
}

export const redisClient = createClient(redisConfig);

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

redisClient.on('reconnecting', () => {
    console.log('⏳ Redis reconnecting...');
});

redisClient.on('ready', () => {
    console.log('✅ Redis client ready');
});

export async function connectRedis() {
    try {
        await redisClient.connect();
        return redisClient;
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
        throw error;
    }
}

export async function disconnectRedis() {
    try {
        await redisClient.quit();
        console.log('Redis disconnected');
    } catch (error) {
        console.error('Error disconnecting Redis:', error);
    }
}

// Redis helper functions
export const redisHelpers = {
    async set(key: string, value: any, expirationInSeconds?: number) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        if (expirationInSeconds) {
            return await redisClient.setEx(key, expirationInSeconds, stringValue);
        }
        return await redisClient.set(key, stringValue);
    },

    async get(key: string) {
        const value = await redisClient.get(key);
        if (!value) return null;

        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    },

    async delete(key: string) {
        return await redisClient.del(key);
    },

    async exists(key: string) {
        return await redisClient.exists(key);
    },

    async expire(key: string, seconds: number) {
        return await redisClient.expire(key, seconds);
    },

    async increment(key: string) {
        return await redisClient.incr(key);
    },

    async decrement(key: string) {
        return await redisClient.decr(key);
    },
};

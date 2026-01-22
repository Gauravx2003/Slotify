import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Clean all data from the database
 * This script truncates all tables in the correct order (respecting foreign keys)
 */
async function cleanDatabase() {
    try {
        console.log('🧹 Starting database cleanup...\n');

        // Disable foreign key checks temporarily
        await db.execute(sql`SET session_replication_role = 'replica'`);

        const tables = [
            'payments',
            'booking_answers',
            'bookings',
            'questions',
            'schedules',
            'appointment_type_resources',
            'resources',
            'appointment_types',
            'verifications',
            'sessions',
            'accounts',
            'users',
        ];

        for (const table of tables) {
            try {
                await db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
                console.log(`✅ Truncated table: ${table}`);
            } catch (error: any) {
                if (error.code === '42P01') {
                    console.log(`⚠️  Table ${table} does not exist, skipping...`);
                } else {
                    throw error;
                }
            }
        }

        // Re-enable foreign key checks
        await db.execute(sql`SET session_replication_role = 'origin'`);

        console.log('\n✅ Database cleaned successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cleaning database:', error);
        process.exit(1);
    }
}

cleanDatabase();

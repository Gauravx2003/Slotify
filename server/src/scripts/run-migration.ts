import { db } from '../db';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Run manual SQL migration to add missing user columns
 */
async function runMigration() {
    try {
        console.log('🔧 Running manual migration to add user columns...');

        const migrationSQL = readFileSync(
            join(__dirname, '../db/migrations/add_user_columns.sql'),
            'utf-8'
        );

        await db.execute(sql.raw(migrationSQL));

        console.log('✅ Migration completed successfully!');
        console.log('Added columns: role, is_active, phone to users table');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();

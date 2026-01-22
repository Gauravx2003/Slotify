import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrationClient } from './index';

async function runMigrations() {
    console.log('Running migrations...');

    const db = drizzle(migrationClient);

    try {
        await migrate(db, { migrationsFolder: './src/db/migrations' });
        console.log('Migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigrations();

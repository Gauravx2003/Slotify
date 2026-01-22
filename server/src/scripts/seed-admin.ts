import { db } from '../db';
import { users, accounts } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

/**
 * Seed script to create an admin user
 * Email: admin@gmail.com
 * Password: admin123
 */
async function seedAdmin() {
    try {
        console.log('🌱 Starting admin user seed...');

        const adminEmail = 'admin@gmail.com';
        const adminPassword = 'admin123';

        // Check if admin user already exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, adminEmail),
        });

        if (existingUser) {
            console.log('⚠️  Admin user already exists with email:', adminEmail);
            console.log('User ID:', existingUser.id);
            console.log('Role:', existingUser.role);
            return;
        }

        // Generate a unique user ID
        const userId = randomBytes(16).toString('hex');

        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create the admin user
        const [newUser] = await db
            .insert(users)
            .values({
                id: userId,
                name: 'Admin',
                email: adminEmail,
                emailVerified: true, // Admin is pre-verified
                role: 'admin',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        if (!newUser) {
            throw new Error('Failed to create admin user');
        }

        console.log('✅ Admin user created successfully!');
        console.log('User ID:', newUser.id);
        console.log('Email:', newUser.email);
        console.log('Role:', newUser.role);

        // Create an account entry with the hashed password
        // This is required by better-auth for email/password authentication
        const accountId = randomBytes(16).toString('hex');

        await db.insert(accounts).values({
            id: accountId,
            userId: newUser.id,
            accountId: newUser.email, // Use email as account identifier
            providerId: 'credential', // better-auth uses 'credential' for email/password
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        console.log('✅ Admin account credentials created successfully!');
        console.log('\n📋 Admin Login Credentials:');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
        console.log('\n⚠️  Please change the password after first login!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin user:', error);
        process.exit(1);
    }
}

// Run the seed function
seedAdmin();

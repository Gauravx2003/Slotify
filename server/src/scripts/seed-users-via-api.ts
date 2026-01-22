/**
 * Alternative seed script that uses Better Auth's signup API
 * This ensures passwords are hashed correctly by better-auth
 */

const API_URL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

interface UserData {
    email: string;
    password: string;
    name: string;
    role: 'customer' | 'organiser';
}

async function signupUser(userData: UserData): Promise<void> {
    try {
        console.log(`  Creating ${userData.role}: ${userData.email}`);

        const response = await fetch(`${API_URL}/api/auth/sign-up/email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            const error = await response.text();
            console.log(`  ⚠️  Failed to create ${userData.email}: ${error}`);
            return;
        }

        const result = await response.json();
        console.log(`  ✅ Created: ${userData.email}`);
    } catch (error) {
        console.error(`  ❌ Error creating ${userData.email}:`, error);
    }
}

async function seedUsers() {
    console.log('🌱 Creating users via Better Auth signup API...\\n');

    const users: UserData[] = [
        {
            email: 'customer1@example.com',
            password: 'customer123',
            name: 'John Customer',
            role: 'customer',
        },
        {
            email: 'customer2@example.com',
            password: 'customer123',
            name: 'Jane Doe',
            role: 'customer',
        },
        {
            email: 'organizer1@example.com',
            password: 'organizer123',
            name: 'Dr. Smith Medical',
            role: 'organiser',
        },
        {
            email: 'organizer2@example.com',
            password: 'organizer123',
            name: 'FitGym Studio',
            role: 'organiser',
        },
    ];

    for (const user of users) {
        await signupUser(user);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\\n✅ User creation complete!');
    console.log('\\n📋 Test Accounts:');
    console.log('  • customer1@example.com / customer123');
    console.log('  • customer2@example.com / customer123');
    console.log('  • organizer1@example.com / organizer123');
    console.log('  • organizer2@example.com / organizer123');
    console.log('\\nℹ️  Note: You may need to verify emails via OTP if email verification is enabled.');
    console.log('    Run the full seed script (seed-booking-data.ts) after this to create appointments.');
}

// Run if executed directly
seedUsers().catch(console.error);

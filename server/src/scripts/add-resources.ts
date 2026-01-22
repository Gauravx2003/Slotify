import { db } from '../db';
import { resources, appointmentTypeResources } from '../db/schema';
import { randomBytes } from 'crypto';

function generateId(): string {
    return randomBytes(16).toString('hex');
}

async function addResources() {
    const appointmentTypeId = 'f64d6ebc-ea5e-40a0-807d-52f4dfa26220';
    const ownerId = 'oZ0LPGm4MhLOLtyCqr35tLybqXwI11hy';

    console.log('🔧 Adding resources to appointment type...');
    console.log('='.repeat(60));

    // Create 2 resources for this appointment type
    const resourceNames = ['Staff Member 1', 'Staff Member 2'];
    const createdResources = [];

    for (let i = 0; i < resourceNames.length; i++) {
        const resourceId = generateId();
        const resourceName = resourceNames[i];

        console.log(`Creating resource: ${resourceName}...`);

        // Create the resource
        const [resource] = await db.insert(resources).values({
            id: resourceId,
            ownerId: ownerId,
            name: resourceName as string,
            type: 'user',
            capacity: 1,
            email: `staff${i + 1}_${appointmentTypeId.substring(0, 8)}@example.com`,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        // Link resource to appointment type
        await db.insert(appointmentTypeResources).values({
            id: generateId(),
            appointmentTypeId: appointmentTypeId,
            resourceId: resourceId,
            createdAt: new Date(),
        });

        createdResources.push(resource);
        console.log(`  ✅ Created and linked: ${resourceName} (ID: ${resourceId})`);
    }

    console.log('');
    console.log('='.repeat(60));
    console.log(`✅ Successfully added ${createdResources.length} resources!`);
    console.log('You can now create bookings for this appointment type.');
    console.log('='.repeat(60));

    process.exit(0);
}

addResources().catch((err) => {
    console.error('❌ Error adding resources:', err);
    process.exit(1);
});

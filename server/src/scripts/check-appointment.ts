import { db } from '../db';
import { appointmentTypes, resources, appointmentTypeResources } from '../db/schema';
import { eq } from 'drizzle-orm';

async function checkAppointment() {
    const appointmentTypeId = 'f64d6ebc-ea5e-40a0-807d-52f4dfa26220';

    console.log('🔍 Checking appointment type:', appointmentTypeId);
    console.log('='.repeat(60));

    // Check if appointment type exists
    const [apptType] = await db
        .select()
        .from(appointmentTypes)
        .where(eq(appointmentTypes.id, appointmentTypeId));

    if (!apptType) {
        console.log('❌ Appointment type NOT FOUND');
        process.exit(1);
    }

    console.log('✅ Appointment Type Found:');
    console.log('  - Title:', apptType.title);
    console.log('  - Assignment Type:', apptType.assignmentType);
    console.log('  - Is Published:', apptType.isPublished);
    console.log('  - Duration:', apptType.durationMinutes, 'minutes');
    console.log('  - Owner ID:', apptType.ownerId);
    console.log('');

    // Check linked resources
    const linkedResources = await db
        .select({
            resourceId: appointmentTypeResources.resourceId,
            resourceName: resources.name,
            resourceType: resources.type,
            resourceCapacity: resources.capacity,
        })
        .from(appointmentTypeResources)
        .innerJoin(
            resources,
            eq(appointmentTypeResources.resourceId, resources.id)
        )
        .where(eq(appointmentTypeResources.appointmentTypeId, appointmentTypeId));

    console.log('📊 Linked Resources:');
    if (linkedResources.length === 0) {
        console.log('  ❌ NO RESOURCES LINKED TO THIS APPOINTMENT TYPE!');
        console.log('  This is the problem - resources need to be added.');
    } else {
        console.log(`  ✅ Found ${linkedResources.length} resource(s):`);
        linkedResources.forEach((r, i) => {
            console.log(`  ${i + 1}. ${r.resourceName} (${r.resourceType})`);
            console.log(`     - ID: ${r.resourceId}`);
            console.log(`     - Capacity: ${r.resourceCapacity}`);
        });
    }

    console.log('');
    console.log('='.repeat(60));
    process.exit(0);
}

checkAppointment().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});

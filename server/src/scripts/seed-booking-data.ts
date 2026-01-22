import { db } from '../db';
import {
    users,
    accounts,
    appointmentTypes,
    resources,
    appointmentTypeResources,
    schedules,
    questions,
    bookings,
    bookingAnswers,
    payments,
} from '../db/schema';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateId(): string {
    return randomBytes(16).toString('hex');
}

function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement<T>(arr: T[]): T {
    if (arr.length === 0) throw new Error('Array is empty');
    return arr[Math.floor(Math.random() * arr.length)] as T;
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function setTime(date: Date, hours: number, minutes: number): Date {
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
}

// ============================================
// DATA CONSTANTS
// ============================================

const CUSTOMER_NAMES = [
    'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Gupta', 'Vikram Singh',
    'Ananya Reddy', 'Rohan Mehta', 'Kavya Nair', 'Arjun Verma', 'Divya Joshi',
    'Karan Malhotra', 'Neha Agarwal', 'Sanjay Rao', 'Pooja Desai', 'Aditya Kapoor',
    'Meera Iyer', 'Raj Chauhan', 'Simran Kaur', 'Varun Khanna', 'Ishita Banerjee',
    'Nikhil Saxena', 'Riya Choudhary', 'Aarav Tiwari', 'Tanvi Mishra', 'Dhruv Pandey',
    'Shruti Thakur', 'Yash Srivastava', 'Kriti Bhatia', 'Manish Dubey', 'Anjali Menon'
];

const ORGANIZER_DATA = [
    { name: 'Dr. Rajesh Kumar', specialty: 'General Medicine', email: 'dr.rajesh@clinic.com' },
    { name: 'Dr. Sunita Sharma', specialty: 'Dentistry', email: 'dr.sunita@dentalcare.com' },
    { name: 'Fitness Pro Gym', specialty: 'Fitness & Training', email: 'contact@fitnesspro.com' },
    { name: 'Wellness Center', specialty: 'Yoga & Wellness', email: 'info@wellnesscenter.com' },
    { name: 'TechRecruit Solutions', specialty: 'HR & Recruitment', email: 'hr@techrecruit.com' },
    { name: 'Dr. Anand Patel', specialty: 'Physiotherapy', email: 'dr.anand@physiocare.com' },
    { name: 'Beauty Studio', specialty: 'Salon & Spa', email: 'book@beautystudio.com' },
    { name: 'Legal Associates', specialty: 'Legal Consultation', email: 'consult@legalassoc.com' },
];

const APPOINTMENT_TYPES_DATA = [
    {
        title: 'General Health Consultation',
        description: 'Comprehensive health checkup and consultation with experienced physicians. Includes basic health assessment, prescription, and follow-up recommendations.',
        duration: 30,
        location: 'Room 101, City Medical Center',
        isPaid: false,
        bookingFee: 0,
        organizerIndex: 0,
        maxCapacity: 1,
    },
    {
        title: 'Dental Care & Examination',
        description: 'Complete dental examination including X-rays, cleaning, and treatment plan. Our certified dentists provide comprehensive oral care.',
        duration: 45,
        location: 'Dental Wing, Floor 2',
        isPaid: true,
        bookingFee: 150000, // ₹1500
        organizerIndex: 1,
        maxCapacity: 1,
    },
    {
        title: 'Personal Training Session',
        description: 'One-on-one fitness training with certified personal trainers. Customized workout plans based on your fitness goals.',
        duration: 60,
        location: 'Fitness Pro Gym, Sector 15',
        isPaid: true,
        bookingFee: 80000, // ₹800
        organizerIndex: 2,
        maxCapacity: 1,
    },
    {
        title: 'Group Yoga Class',
        description: 'Join our relaxing group yoga sessions led by experienced instructors. Suitable for all levels from beginners to advanced.',
        duration: 75,
        location: 'Wellness Center, Main Hall',
        isPaid: true,
        bookingFee: 50000, // ₹500
        organizerIndex: 3,
        maxCapacity: 15,
    },
    {
        title: 'Technical Interview',
        description: 'Technical screening interview for software engineering positions. Assessment includes coding, system design, and behavioral questions.',
        duration: 60,
        location: null, // Online
        isPaid: false,
        bookingFee: 0,
        organizerIndex: 4,
        maxCapacity: 1,
    },
    {
        title: 'Physiotherapy Session',
        description: 'Professional physiotherapy treatment for injury recovery, chronic pain, and mobility improvement. Personalized treatment plans.',
        duration: 45,
        location: 'PhysioCare Clinic, Block A',
        isPaid: true,
        bookingFee: 120000, // ₹1200
        organizerIndex: 5,
        maxCapacity: 1,
    },
    {
        title: 'Hair Styling & Treatment',
        description: 'Professional hair styling, cutting, and treatment services. Includes consultation, wash, cut, and styling.',
        duration: 90,
        location: 'Beauty Studio, Mall Road',
        isPaid: true,
        bookingFee: 200000, // ₹2000
        organizerIndex: 6,
        maxCapacity: 1,
    },
    {
        title: 'Legal Consultation',
        description: 'Professional legal advice and consultation. Covers property matters, contracts, business law, and civil disputes.',
        duration: 45,
        location: 'Legal Associates, Tower B',
        isPaid: true,
        bookingFee: 250000, // ₹2500
        organizerIndex: 7,
        maxCapacity: 1,
    },
];

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SCHEDULE_TEMPLATES = [
    // Weekday mornings
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], from: '09:00', to: '13:00' },
    // Weekday afternoons
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], from: '14:00', to: '18:00' },
    // Saturday morning
    { days: ['Saturday'], from: '10:00', to: '14:00' },
    // Evening slots
    { days: ['Monday', 'Wednesday', 'Friday'], from: '18:00', to: '20:00' },
];

const BOOKING_SUBJECTS = [
    'Regular checkup', 'Follow-up appointment', 'First consultation', 'Routine visit',
    'Health assessment', 'Treatment session', 'Evaluation', 'Consultation',
    'Therapy session', 'Training assessment', 'Review appointment', 'Initial consultation'
];

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function seedBookingData() {
    try {
        console.log('🌱 Starting comprehensive data seeding...\n');

        const now = new Date();
        const threeMonthsAgo = addDays(now, -90);

        // ============================================
        // 1. CREATE CUSTOMERS (30 customers)
        // ============================================
        console.log('👥 Creating customers...');
        const customerIds: string[] = [];
        const hashedCustomerPassword = await bcrypt.hash('customer123', 10);

        for (let i = 0; i < CUSTOMER_NAMES.length; i++) {
            const userId = generateId();
            const email = `customer${i + 1}@example.com`;
            const createdAt = randomDate(addDays(threeMonthsAgo, -30), addDays(threeMonthsAgo, 30));
            const customerName = CUSTOMER_NAMES[i];

            if (!customerName) continue;

            await db.insert(users).values({
                id: userId,
                name: customerName,
                email: email,
                emailVerified: Math.random() > 0.15, // 85% verified
                role: 'customer',
                isActive: Math.random() > 0.05, // 95% active
                phone: `+91 ${randomInt(70000, 99999)}${randomInt(10000, 99999)}`,
                createdAt: createdAt,
                updatedAt: createdAt,
            });

            await db.insert(accounts).values({
                id: generateId(),
                userId: userId,
                accountId: email,
                providerId: 'credential',
                password: hashedCustomerPassword,
                createdAt: createdAt,
                updatedAt: createdAt,
            });

            customerIds.push(userId);
        }
        console.log(`✅ Created ${CUSTOMER_NAMES.length} customers`);

        // ============================================
        // 2. CREATE ORGANIZERS (8 organizers)
        // ============================================
        console.log('🏢 Creating organizers...');
        const organizerIds: string[] = [];
        const hashedOrganizerPassword = await bcrypt.hash('organizer123', 10);

        for (let i = 0; i < ORGANIZER_DATA.length; i++) {
            const org = ORGANIZER_DATA[i];
            if (!org) continue;
            
            const userId = generateId();
            const createdAt = randomDate(addDays(threeMonthsAgo, -60), addDays(threeMonthsAgo, -30));

            await db.insert(users).values({
                id: userId,
                name: org.name,
                email: org.email,
                emailVerified: true,
                role: 'organiser',
                isActive: true,
                phone: `+91 ${randomInt(70000, 99999)}${randomInt(10000, 99999)}`,
                createdAt: createdAt,
                updatedAt: createdAt,
            });

            await db.insert(accounts).values({
                id: generateId(),
                userId: userId,
                accountId: org.email,
                providerId: 'credential',
                password: hashedOrganizerPassword,
                createdAt: createdAt,
                updatedAt: createdAt,
            });

            organizerIds.push(userId);
        }
        console.log(`✅ Created ${ORGANIZER_DATA.length} organizers`);

        // ============================================
        // 3. CREATE APPOINTMENT TYPES
        // ============================================
        console.log('📅 Creating appointment types...');
        const appointmentTypeIds: { id: string; duration: number; isPaid: boolean; fee: number; organizerIndex: number }[] = [];

        for (const apt of APPOINTMENT_TYPES_DATA) {
            const aptId = generateId();
            const createdAt = randomDate(addDays(threeMonthsAgo, -45), addDays(threeMonthsAgo, -15));
            const organizerId = organizerIds[apt.organizerIndex];
            
            if (!organizerId) continue;

            await db.insert(appointmentTypes).values({
                id: aptId,
                ownerId: organizerId,
                title: apt.title,
                description: apt.description,
                durationMinutes: apt.duration,
                location: apt.location,
                assignmentType: 'automatic',
                isPublished: true,
                isPaid: apt.isPaid,
                bookingFeeCents: apt.bookingFee,
                manageCapacity: apt.maxCapacity > 1,
                maxCapacity: apt.maxCapacity,
                manualConfirmation: Math.random() > 0.7, // 30% require manual confirmation
                cancellationHours: randomElement([1, 2, 4, 12, 24]),
                slotCreationMode: 'automatic',
                shareToken: generateId().substring(0, 12),
                introMessage: `Welcome! Thank you for booking with us. Please arrive 10 minutes early.`,
                confirmationMessage: `Your appointment has been confirmed. We look forward to seeing you!`,
                createdAt: createdAt,
                updatedAt: createdAt,
            });

            appointmentTypeIds.push({
                id: aptId,
                duration: apt.duration,
                isPaid: apt.isPaid,
                fee: apt.bookingFee,
                organizerIndex: apt.organizerIndex,
            });
        }
        console.log(`✅ Created ${APPOINTMENT_TYPES_DATA.length} appointment types`);

        // ============================================
        // 4. CREATE RESOURCES FOR EACH APPOINTMENT TYPE
        // ============================================
        console.log('🔧 Creating resources...');
        const resourceMap: Map<string, string[]> = new Map();

        for (const apt of appointmentTypeIds) {
            const resourceCount = randomInt(1, 3);
            const resourceIds: string[] = [];
            const organizerId = organizerIds[apt.organizerIndex];

            if (!organizerId) continue;

            for (let i = 0; i < resourceCount; i++) {
                const resourceId = generateId();
                const resourceType = Math.random() > 0.5 ? 'user' : 'resource';
                const resourceName = resourceType === 'user'
                    ? `Staff Member ${i + 1}`
                    : `Room ${String.fromCharCode(65 + i)}`;

                await db.insert(resources).values({
                    id: resourceId,
                    ownerId: organizerId,
                    name: resourceName,
                    type: resourceType,
                    capacity: 1,
                    email: resourceType === 'user' ? `staff${i + 1}_${apt.id.substring(0, 8)}@example.com` : null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                await db.insert(appointmentTypeResources).values({
                    id: generateId(),
                    appointmentTypeId: apt.id,
                    resourceId: resourceId,
                    createdAt: new Date(),
                });

                resourceIds.push(resourceId);
            }
            resourceMap.set(apt.id, resourceIds);
        }
        console.log('✅ Created resources for all appointment types');

        // ============================================
        // 5. CREATE SCHEDULES FOR EACH APPOINTMENT TYPE
        // ============================================
        console.log('🕐 Creating schedules...');

        for (const apt of appointmentTypeIds) {
            // Each appointment gets 2-3 schedule templates
            const templateCount = randomInt(2, 3);

            for (let t = 0; t < templateCount; t++) {
                const template = SCHEDULE_TEMPLATES[t];
                if (!template) continue;
                
                for (const day of template.days) {
                    await db.insert(schedules).values({
                        id: generateId(),
                        appointmentTypeId: apt.id,
                        dayOfWeek: day,
                        fromTime: template.from,
                        toTime: template.to,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
            }
        }
        console.log('✅ Created schedules for all appointment types');

        // ============================================
        // 6. CREATE QUESTIONS FOR APPOINTMENT TYPES
        // ============================================
        console.log('❓ Creating booking questions...');
        const questionIds: Map<string, string[]> = new Map();

        const questionTemplates = [
            { text: 'What is the reason for your visit?', type: 'single_line', mandatory: true },
            { text: 'Do you have any allergies or medical conditions?', type: 'multi_line', mandatory: false },
            { text: 'Preferred contact number', type: 'phone', mandatory: true },
            { text: 'Have you visited us before?', type: 'radio', mandatory: true },
            { text: 'How did you hear about us?', type: 'checkbox', mandatory: false },
        ];

        for (const apt of appointmentTypeIds) {
            const aptQuestionIds: string[] = [];
            const questionCount = randomInt(2, 4);

            for (let i = 0; i < questionCount; i++) {
                const template = questionTemplates[i % questionTemplates.length];
                if (!template) continue;
                
                const questionId = generateId();

                await db.insert(questions).values({
                    id: questionId,
                    appointmentTypeId: apt.id,
                    questionText: template.text,
                    answerType: template.type,
                    isMandatory: template.mandatory,
                    sortOrder: i,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                aptQuestionIds.push(questionId);
            }
            questionIds.set(apt.id, aptQuestionIds);
        }
        console.log('✅ Created booking questions');

        // ============================================
        // 7. CREATE BOOKINGS (3 months of data)
        // ============================================
        console.log('📋 Creating bookings (this may take a moment)...');
        
        let totalBookings = 0;
        let completedBookings = 0;
        let bookedBookings = 0;
        let cancelledBookings = 0;
        let requestBookings = 0;
        let paidBookingsCount = 0;

        // Generate bookings for each day in the 3-month period
        for (let dayOffset = -90; dayOffset <= 30; dayOffset++) {
            const currentDate = addDays(now, dayOffset);
            
            // Skip some days randomly (weekends have fewer bookings)
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
            const bookingsForDay = isWeekend ? randomInt(3, 8) : randomInt(8, 20);

            for (let b = 0; b < bookingsForDay; b++) {
                const apt = randomElement(appointmentTypeIds);
                const customer = randomElement(CUSTOMER_NAMES);
                const customerEmail = `${customer.toLowerCase().replace(/\s+/g, '.')}@email.com`;
                const resourceIds = resourceMap.get(apt.id) || [];
                const resourceId = resourceIds.length > 0 ? randomElement(resourceIds) : null;

                // Generate realistic booking times based on business hours
                const hour = randomInt(9, 17);
                const minute = randomElement([0, 15, 30, 45]);
                const startTime = setTime(currentDate, hour, minute);
                const endTime = addMinutes(startTime, apt.duration);

                // Determine status based on date
                let status: string;
                if (dayOffset < -7) {
                    // Past bookings (more than a week ago)
                    const statusRoll = Math.random();
                    if (statusRoll < 0.75) {
                        status = 'completed';
                        completedBookings++;
                    } else if (statusRoll < 0.90) {
                        status = 'cancelled';
                        cancelledBookings++;
                    } else {
                        status = 'booked'; // No-shows
                        bookedBookings++;
                    }
                } else if (dayOffset < 0) {
                    // Recent past (last week)
                    const statusRoll = Math.random();
                    if (statusRoll < 0.60) {
                        status = 'completed';
                        completedBookings++;
                    } else if (statusRoll < 0.85) {
                        status = 'booked';
                        bookedBookings++;
                    } else {
                        status = 'cancelled';
                        cancelledBookings++;
                    }
                } else {
                    // Future bookings
                    const statusRoll = Math.random();
                    if (statusRoll < 0.70) {
                        status = 'booked';
                        bookedBookings++;
                    } else if (statusRoll < 0.85) {
                        status = 'request';
                        requestBookings++;
                    } else {
                        status = 'cancelled';
                        cancelledBookings++;
                    }
                }

                const bookingId = generateId();
                const createdAt = addDays(startTime, -randomInt(1, 14)); // Booked 1-14 days before

                await db.insert(bookings).values({
                    id: bookingId,
                    appointmentTypeId: apt.id,
                    resourceId: resourceId,
                    customerName: customer,
                    customerEmail: customerEmail,
                    customerPhone: `+91 ${randomInt(70000, 99999)}${randomInt(10000, 99999)}`,
                    startTime: startTime,
                    endTime: endTime,
                    status: status,
                    numPeople: 1,
                    subject: randomElement(BOOKING_SUBJECTS),
                    createdAt: createdAt,
                    updatedAt: createdAt,
                });

                // Create booking answers
                const aptQuestions = questionIds.get(apt.id) || [];
                for (const questionId of aptQuestions) {
                    await db.insert(bookingAnswers).values({
                        id: generateId(),
                        bookingId: bookingId,
                        questionId: questionId,
                        answerText: 'Sample answer for this question',
                        createdAt: createdAt,
                    });
                }

                // Create payment for paid appointments
                if (apt.isPaid && apt.fee > 0 && status !== 'cancelled') {
                    const paymentStatus = status === 'completed' ? 'completed' : 
                                         status === 'booked' ? (Math.random() > 0.3 ? 'completed' : 'pending') :
                                         'pending';

                    await db.insert(payments).values({
                        id: generateId(),
                        bookingId: bookingId,
                        amountCents: apt.fee,
                        currency: 'INR',
                        paymentMethod: randomElement(['credit_card', 'debit_card', 'upi', 'paypal']),
                        paymentStatus: paymentStatus,
                        transactionId: paymentStatus === 'completed' ? `TXN${generateId().substring(0, 12).toUpperCase()}` : null,
                        paidAt: paymentStatus === 'completed' ? createdAt : null,
                        createdAt: createdAt,
                        updatedAt: createdAt,
                    });
                    paidBookingsCount++;
                }

                totalBookings++;
            }
        }

        console.log(`✅ Created ${totalBookings} bookings`);
        console.log(`   - Completed: ${completedBookings}`);
        console.log(`   - Booked: ${bookedBookings}`);
        console.log(`   - Pending (Request): ${requestBookings}`);
        console.log(`   - Cancelled: ${cancelledBookings}`);
        console.log(`   - Paid bookings: ${paidBookingsCount}`);

        // ============================================
        // SUMMARY
        // ============================================
        console.log('\n' + '='.repeat(50));
        console.log('📊 SEEDING COMPLETE - SUMMARY');
        console.log('='.repeat(50));
        console.log(`👥 Customers: ${CUSTOMER_NAMES.length}`);
        console.log(`🏢 Organizers: ${ORGANIZER_DATA.length}`);
        console.log(`📅 Appointment Types: ${APPOINTMENT_TYPES_DATA.length}`);
        console.log(`📋 Total Bookings: ${totalBookings}`);
        console.log(`💰 Paid Bookings: ${paidBookingsCount}`);
        console.log('='.repeat(50));
        
        console.log('\n📋 TEST CREDENTIALS:');
        console.log('─'.repeat(40));
        console.log('Customers:');
        console.log('  Email: customer1@example.com - customer30@example.com');
        console.log('  Password: customer123');
        console.log('');
        console.log('Organizers:');
        for (const org of ORGANIZER_DATA) {
            console.log(`  ${org.name}: ${org.email}`);
        }
        console.log('  Password: organizer123');
        console.log('─'.repeat(40));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding booking data:', error);
        process.exit(1);
    }
}

seedBookingData();

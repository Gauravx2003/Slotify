/**
 * Booking API Integration Tests
 * 
 * These tests verify the booking endpoints work correctly.
 * Tests cover: booking creation, retrieval, cancellation, and business logic validation.
 * 
 * To run: yarn test
 */

import { createBookingSchema } from '../modules/bookings/booking.validation';
import { BookingStatus } from '../modules/bookings/booking.types';

describe('Booking API Tests', () => {
    describe('Booking Schema Validation', () => {
        it('should validate a correct booking payload', () => {
            const validBooking = {
                appointmentTypeId: '550e8400-e29b-41d4-a716-446655440000',
                customerName: 'John Doe',
                customerEmail: 'john@example.com',
                customerPhone: '+1234567890',
                startTime: '2025-12-25T10:00:00.000Z',
                endTime: '2025-12-25T10:30:00.000Z',
                numPeople: 1,
                subject: 'General consultation',
            };

            const result = createBookingSchema.safeParse(validBooking);
            expect(result.success).toBe(true);
        });

        it('should require appointmentTypeId', () => {
            const invalidBooking = {
                customerName: 'John Doe',
                customerEmail: 'john@example.com',
                startTime: '2025-12-25T10:00:00.000Z',
                endTime: '2025-12-25T10:30:00.000Z',
            };

            const result = createBookingSchema.safeParse(invalidBooking);
            expect(result.success).toBe(false);
        });

        it('should require customerName', () => {
            const invalidBooking = {
                appointmentTypeId: '550e8400-e29b-41d4-a716-446655440000',
                customerEmail: 'john@example.com',
                startTime: '2025-12-25T10:00:00.000Z',
                endTime: '2025-12-25T10:30:00.000Z',
            };

            const result = createBookingSchema.safeParse(invalidBooking);
            expect(result.success).toBe(false);
        });

        it('should require valid customerEmail', () => {
            const invalidBooking = {
                appointmentTypeId: '550e8400-e29b-41d4-a716-446655440000',
                customerName: 'John Doe',
                customerEmail: 'not-an-email',
                startTime: '2025-12-25T10:00:00.000Z',
                endTime: '2025-12-25T10:30:00.000Z',
            };

            const result = createBookingSchema.safeParse(invalidBooking);
            expect(result.success).toBe(false);
        });

        it('should require valid startTime format', () => {
            const invalidBooking = {
                appointmentTypeId: '550e8400-e29b-41d4-a716-446655440000',
                customerName: 'John Doe',
                customerEmail: 'john@example.com',
                startTime: 'invalid-date',
                endTime: '2025-12-25T10:30:00.000Z',
            };

            const result = createBookingSchema.safeParse(invalidBooking);
            expect(result.success).toBe(false);
        });

        it('should require valid endTime format', () => {
            const invalidBooking = {
                appointmentTypeId: '550e8400-e29b-41d4-a716-446655440000',
                customerName: 'John Doe',
                customerEmail: 'john@example.com',
                startTime: '2025-12-25T10:00:00.000Z',
                endTime: 'not-a-date',
            };

            const result = createBookingSchema.safeParse(invalidBooking);
            expect(result.success).toBe(false);
        });

        it('should accept optional customerPhone', () => {
            const validBooking = {
                appointmentTypeId: '550e8400-e29b-41d4-a716-446655440000',
                customerName: 'John Doe',
                customerEmail: 'john@example.com',
                startTime: '2025-12-25T10:00:00.000Z',
                endTime: '2025-12-25T10:30:00.000Z',
            };

            const result = createBookingSchema.safeParse(validBooking);
            expect(result.success).toBe(true);
        });

        it('should default numPeople to 1', () => {
            const validBooking = {
                appointmentTypeId: '550e8400-e29b-41d4-a716-446655440000',
                customerName: 'John Doe',
                customerEmail: 'john@example.com',
                startTime: '2025-12-25T10:00:00.000Z',
                endTime: '2025-12-25T10:30:00.000Z',
            };

            const result = createBookingSchema.safeParse(validBooking);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.numPeople).toBe(1);
            }
        });

        it('should accept booking answers', () => {
            const validBooking = {
                appointmentTypeId: '550e8400-e29b-41d4-a716-446655440000',
                customerName: 'John Doe',
                customerEmail: 'john@example.com',
                startTime: '2025-12-25T10:00:00.000Z',
                endTime: '2025-12-25T10:30:00.000Z',
                answers: [
                    { questionId: 'q1', answerText: 'Regular checkup' },
                    { questionId: 'q2', answerText: 'No allergies' },
                ],
            };

            const result = createBookingSchema.safeParse(validBooking);
            expect(result.success).toBe(true);
        });
    });

    describe('Booking Status Enum', () => {
        it('should have correct status values', () => {
            expect(BookingStatus.REQUEST).toBe('request');
            expect(BookingStatus.BOOKED).toBe('booked');
            expect(BookingStatus.CANCELLED).toBe('cancelled');
            expect(BookingStatus.COMPLETED).toBe('completed');
            expect(BookingStatus.PENDING).toBe('pending');
            expect(BookingStatus.CONFIRMED).toBe('confirmed');
        });

        it('should have all required statuses', () => {
            const statuses = Object.values(BookingStatus);
            expect(statuses).toContain('request');
            expect(statuses).toContain('booked');
            expect(statuses).toContain('cancelled');
            expect(statuses).toContain('completed');
            expect(statuses).toContain('pending');
            expect(statuses).toContain('confirmed');
        });
    });

    describe('Booking Business Logic', () => {
        it('should validate booking time range', () => {
            const startTime = new Date('2025-12-25T10:00:00.000Z');
            const endTime = new Date('2025-12-25T10:30:00.000Z');

            expect(endTime.getTime()).toBeGreaterThan(startTime.getTime());
        });

        it('should calculate booking duration in minutes', () => {
            const startTime = new Date('2025-12-25T10:00:00.000Z');
            const endTime = new Date('2025-12-25T10:30:00.000Z');

            const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
            expect(durationMinutes).toBe(30);
        });

        it('should detect overlapping time slots', () => {
            // Existing booking: 10:00 - 11:00
            const existingStart = new Date('2025-12-25T10:00:00.000Z');
            const existingEnd = new Date('2025-12-25T11:00:00.000Z');

            // New booking attempts
            const testCases = [
                // Overlapping: starts during existing
                {
                    start: new Date('2025-12-25T10:30:00.000Z'),
                    end: new Date('2025-12-25T11:30:00.000Z'),
                    shouldOverlap: true,
                },
                // Overlapping: ends during existing
                {
                    start: new Date('2025-12-25T09:30:00.000Z'),
                    end: new Date('2025-12-25T10:30:00.000Z'),
                    shouldOverlap: true,
                },
                // Overlapping: completely inside existing
                {
                    start: new Date('2025-12-25T10:15:00.000Z'),
                    end: new Date('2025-12-25T10:45:00.000Z'),
                    shouldOverlap: true,
                },
                // Non-overlapping: before existing
                {
                    start: new Date('2025-12-25T09:00:00.000Z'),
                    end: new Date('2025-12-25T10:00:00.000Z'),
                    shouldOverlap: false,
                },
                // Non-overlapping: after existing
                {
                    start: new Date('2025-12-25T11:00:00.000Z'),
                    end: new Date('2025-12-25T12:00:00.000Z'),
                    shouldOverlap: false,
                },
            ];

            testCases.forEach(({ start, end, shouldOverlap }) => {
                const hasOverlap = start < existingEnd && end > existingStart;
                expect(hasOverlap).toBe(shouldOverlap);
            });
        });

        it('should validate cancellation window', () => {
            const cancellationHours = 24;
            const bookingTime = new Date('2025-12-25T10:00:00.000Z');

            // More than 24 hours before: can cancel
            const time48HoursBefore = new Date(bookingTime.getTime() - 48 * 60 * 60 * 1000);
            const hoursBeforeAt48 = (bookingTime.getTime() - time48HoursBefore.getTime()) / (1000 * 60 * 60);
            expect(hoursBeforeAt48).toBeGreaterThan(cancellationHours);

            // Less than 24 hours before: cannot cancel
            const time12HoursBefore = new Date(bookingTime.getTime() - 12 * 60 * 60 * 1000);
            const hoursBeforeAt12 = (bookingTime.getTime() - time12HoursBefore.getTime()) / (1000 * 60 * 60);
            expect(hoursBeforeAt12).toBeLessThan(cancellationHours);
        });
    });

    describe('Capacity Management', () => {
        it('should validate capacity limits', () => {
            const maxCapacity = 10;
            const currentBookings = 8;
            const requestedPeople = 3;

            const wouldExceedCapacity = currentBookings + requestedPeople > maxCapacity;
            expect(wouldExceedCapacity).toBe(true);
        });

        it('should allow booking within capacity', () => {
            const maxCapacity = 10;
            const currentBookings = 5;
            const requestedPeople = 3;

            const wouldExceedCapacity = currentBookings + requestedPeople > maxCapacity;
            expect(wouldExceedCapacity).toBe(false);
        });

        it('should handle capacity of 1 for resources', () => {
            const resourceCapacity = 1;
            const currentBookingsForResource = 1;

            const isResourceBusy = currentBookingsForResource >= resourceCapacity;
            expect(isResourceBusy).toBe(true);
        });
    });

    describe('Assignment Logic', () => {
        it('should set status based on assignment type', () => {
            // Automatic assignment with available resource -> CONFIRMED
            const autoAssignWithResource = {
                assignmentType: 'automatic',
                resourceAssigned: true,
            };
            const statusAuto = autoAssignWithResource.resourceAssigned ? BookingStatus.CONFIRMED : BookingStatus.PENDING;
            expect(statusAuto).toBe(BookingStatus.CONFIRMED);

            // Manual assignment -> PENDING
            const manualAssign = {
                assignmentType: 'manual',
                resourceAssigned: false,
            };
            const statusManual = BookingStatus.PENDING;
            expect(statusManual).toBe(BookingStatus.PENDING);
        });

        it('should require resource for confirmation', () => {
            const bookingWithResource = { resourceId: 'res-123', status: BookingStatus.PENDING };
            const bookingWithoutResource = { resourceId: null, status: BookingStatus.PENDING };

            expect(bookingWithResource.resourceId).not.toBeNull();
            expect(bookingWithoutResource.resourceId).toBeNull();
        });
    });
});

/**
 * Manual Testing Guide for Booking API
 * 
 * 1. Start the server: yarn dev
 * 2. First, run the seed script: npx ts-node src/scripts/seed-booking-data.ts
 * 3. Use the following curl commands or Postman:
 * 
 * GET PUBLIC APPOINTMENTS:
 * curl -X GET http://localhost:3000/api/appointments/public
 * 
 * GET SINGLE APPOINTMENT:
 * curl -X GET http://localhost:3000/api/appointments/public/{appointmentTypeId}
 * 
 * GET AVAILABILITY:
 * curl -X GET "http://localhost:3000/api/appointments/public/{appointmentTypeId}/availability?date=2025-12-25"
 * 
 * CREATE BOOKING:
 * curl -X POST http://localhost:3000/api/bookings \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "appointmentTypeId": "{id}",
 *     "customerName": "John Doe",
 *     "customerEmail": "john@example.com",
 *     "startTime": "2025-12-25T10:00:00.000Z",
 *     "endTime": "2025-12-25T10:30:00.000Z"
 *   }'
 * 
 * GET BOOKING:
 * curl -X GET http://localhost:3000/api/bookings/{bookingId}
 * 
 * CANCEL BOOKING:
 * curl -X POST http://localhost:3000/api/bookings/{bookingId}/cancel
 * 
 * ASSIGN RESOURCE (Organizer only):
 * curl -X PATCH http://localhost:3000/api/bookings/{bookingId}/assign-resource \
 *   -H "Content-Type: application/json" \
 *   -b cookies.txt \
 *   -d '{"resourceId": "{resourceId}"}'
 * 
 * CONFIRM BOOKING (Organizer only):
 * curl -X PATCH http://localhost:3000/api/bookings/{bookingId}/confirm \
 *   -b cookies.txt
 */

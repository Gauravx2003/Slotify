/**
 * Appointment Types Module - Type Definitions
 * Represents appointment type configurations (not bookings)
 */

// Assignment type for how resources are assigned to bookings
export type AssignmentType = 'automatic' | 'by_visitor';

// Slot creation mode
export type SlotCreationMode = 'automatic' | 'manual';

// Valid days of the week
export const DAYS_OF_WEEK = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

// Appointment Type create/update payloads
export interface CreateAppointmentTypePayload {
    title: string;
    description?: string;
    durationMinutes?: number;
    location?: string;
    assignmentType?: AssignmentType;
    isPaid?: boolean;
    bookingFeeCents?: number;
    manageCapacity?: boolean;
    maxCapacity?: number;
    manualConfirmation?: boolean;
    cancellationHours?: number;
    slotCreationMode?: SlotCreationMode;
    introMessage?: string;
    confirmationMessage?: string;
}

export interface UpdateAppointmentTypePayload {
    title?: string;
    description?: string;
    durationMinutes?: number;
    location?: string;
    assignmentType?: AssignmentType;
    isPublished?: boolean;
    isPaid?: boolean;
    bookingFeeCents?: number;
    manageCapacity?: boolean;
    maxCapacity?: number;
    manualConfirmation?: boolean;
    cancellationHours?: number;
    slotCreationMode?: SlotCreationMode;
    introMessage?: string;
    confirmationMessage?: string;
    imageUrl?: string | null;
}

// Availability slot representation
export interface AvailabilitySlot {
    startTime: string; // ISO datetime string
    endTime: string; // ISO datetime string
    available: boolean;
    remainingCapacity: number;
}

// Query params for listing appointments
export interface ListAppointmentsQuery {
    page?: number;
    limit?: number;
    isPublished?: boolean;
}

// Query params for availability
export interface AvailabilityQuery {
    date: string; // YYYY-MM-DD format
}


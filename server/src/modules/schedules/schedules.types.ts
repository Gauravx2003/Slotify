/**
 * Schedules Module - Type Definitions
 * Represents weekly availability schedules for appointment types
 */

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

// Schedule create payload
export interface CreateSchedulePayload {
    dayOfWeek: DayOfWeek;
    fromTime: string; // HH:MM format
    toTime: string; // HH:MM format
}

// Schedule update payload
export interface UpdateSchedulePayload {
    dayOfWeek?: DayOfWeek;
    fromTime?: string; // HH:MM format
    toTime?: string; // HH:MM format
}

// Schedule response type
export interface ScheduleResponse {
    id: string;
    appointmentTypeId: string;
    dayOfWeek: string;
    fromTime: string;
    toTime: string;
    createdAt: Date;
    updatedAt: Date;
}


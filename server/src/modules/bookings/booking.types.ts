import { Booking, NewBooking } from "../../db/schema";

export enum BookingStatus {
  REQUEST = 'request',
  BOOKED = 'booked',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  PENDING = 'pending',
  CONFIRMED = 'confirmed'
}

export type CreateBookingDTO = {
  appointmentTypeId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | undefined;
  startTime: string; // ISO string
  endTime: string; // ISO string
  timeZone?: string | undefined;
  numPeople?: number | undefined;
  subject?: string | undefined;
  answers?: { questionId: string; answerText: string }[] | undefined;
};

export type UpdateBookingStatusDTO = {
  status: BookingStatus;
};

export type AssignResourceDTO = {
  resourceId: string;
};

export interface BookingWithDetails extends Booking {
  // Add any joined fields here if needed in future
}

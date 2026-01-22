import { z } from "zod";

export const createBookingSchema = z.object({
  appointmentTypeId: z.string().uuid().or(z.string()), // Accept string primarily
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email"),
  customerPhone: z.string().optional(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start time"),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end time"),
  numPeople: z.number().int().positive().default(1),
  subject: z.string().optional(),
  answers: z.array(z.object({
    questionId: z.string(),
    answerText: z.string()
  })).optional()
});

import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

// ============================================
// EXISTING AUTH TABLES (Better Auth)
// ============================================

// Better Auth expects text IDs, not UUIDs
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  role: text("role").notNull().default("customer"), // 'customer' | 'admin' | 'organiser'
  isActive: boolean("is_active").default(true), // For activate/deactivate accounts
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// APPOINTMENT BOOKING SYSTEM TABLES
// ============================================

/**
 * Appointment Types - Master configuration for different appointment types
 * e.g., "Dental Care", "Tennis Court", "Interviews"
 */
export const appointmentTypes = pgTable("appointment_types", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  location: text("location"), // NULL = online appointment
  assignmentType: text("assignment_type").notNull().default("automatic"), // 'automatic' | 'by_visitor'
  isPublished: boolean("is_published").default(false),
  isPaid: boolean("is_paid").default(false),
  bookingFeeCents: integer("booking_fee_cents"), // e.g., 20000 = Rs 200
  manageCapacity: boolean("manage_capacity").default(false),
  maxCapacity: integer("max_capacity").default(1),
  manualConfirmation: boolean("manual_confirmation").default(false),
  cancellationHours: integer("cancellation_hours").default(1),
  slotCreationMode: text("slot_creation_mode").default("automatic"), // 'automatic' | 'manual'
  shareToken: text("share_token").unique(), // For sharing unpublished appointments
  introMessage: text("intro_message"),
  confirmationMessage: text("confirmation_message"),
  imageUrl: text("image_url"), // S3 URL for appointment type image
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Resources - Users or physical resources that can be booked
 * Type: 'user' (A1, A2) or 'resource' (Court 1, R1, R2)
 */
export const resources = pgTable("resources", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'user' | 'resource'
  capacity: integer("capacity").default(1),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Appointment Type Resources - Junction table linking appointment types to resources
 */
export const appointmentTypeResources = pgTable("appointment_type_resources", {
  id: text("id").primaryKey(),
  appointmentTypeId: text("appointment_type_id")
    .notNull()
    .references(() => appointmentTypes.id, { onDelete: "cascade" }),
  resourceId: text("resource_id")
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Schedules - Availability time slots for appointment types
 * Day-based schedule with from/to times (e.g., Monday 09:00-12:00)
 */
export const schedules = pgTable("schedules", {
  id: text("id").primaryKey(),
  appointmentTypeId: text("appointment_type_id")
    .notNull()
    .references(() => appointmentTypes.id, { onDelete: "cascade" }),
  dayOfWeek: text("day_of_week").notNull(), // Monday, Tuesday, etc.
  fromTime: text("from_time").notNull(), // HH:MM format
  toTime: text("to_time").notNull(), // HH:MM format
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Questions - Custom questions for appointment booking forms
 * Answer types: 'single_line', 'multi_line', 'phone', 'radio', 'checkbox'
 */
export const questions = pgTable("questions", {
  id: text("id").primaryKey(),
  appointmentTypeId: text("appointment_type_id")
    .notNull()
    .references(() => appointmentTypes.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  answerType: text("answer_type").notNull(), // 'single_line' | 'multi_line' | 'phone' | 'radio' | 'checkbox'
  options: text("options"), // JSON string array for radio/checkbox options
  isMandatory: boolean("is_mandatory").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Bookings - Actual appointment reservations made by customers
 * Status: 'request' | 'booked' | 'cancelled' | 'completed'
 */
export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),
  appointmentTypeId: text("appointment_type_id")
    .notNull()
    .references(() => appointmentTypes.id, { onDelete: "cascade" }),
  resourceId: text("resource_id").references(() => resources.id, {
    onDelete: "set null",
  }),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("request"), // 'request' | 'booked' | 'cancelled' | 'completed'
  numPeople: integer("num_people").default(1),
  subject: text("subject"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Booking Answers - Customer responses to appointment questions
 */
export const bookingAnswers = pgTable("booking_answers", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  answerText: text("answer_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Payments - Payment records for paid bookings
 * Payment methods: 'credit_card', 'debit_card', 'upi', 'paypal'
 * Payment status: 'pending', 'completed', 'failed', 'refunded'
 */
export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id")
    .notNull()
    .unique()
    .references(() => bookings.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("INR"),
  paymentMethod: text("payment_method"), // 'credit_card' | 'debit_card' | 'upi' | 'paypal'
  paymentStatus: text("payment_status").notNull().default("pending"), // 'pending' | 'completed' | 'failed' | 'refunded'
  transactionId: text("transaction_id"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// RELATIONS
// ============================================

/**
 * Comments - Discussion thread for an appointment type
 */
export const comments = pgTable("comments", {
  id: text("id").primaryKey(),
  message: text("message").notNull(),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "cascade" }), // User who commented (organizer or customer)
  appointmentTypeId: text("appointment_type_id")
    .notNull()
    .references(() => appointmentTypes.id, { onDelete: "cascade" }),
  parentId: text("parent_id"), // Self-reference defined via relations
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// RELATIONS
// ============================================

import { relations } from "drizzle-orm";

export const commentsRelations = relations(comments, ({ one, many }) => ({
  author: one(users, {
    fields: [comments.ownerId],
    references: [users.id],
  }),
  appointmentType: one(appointmentTypes, {
    fields: [comments.appointmentTypeId],
    references: [appointmentTypes.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "replies",
  }),
  replies: many(comments, { relationName: "replies" }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  appointmentType: one(appointmentTypes, {
    fields: [bookings.appointmentTypeId],
    references: [appointmentTypes.id],
  }),
  resource: one(resources, {
    fields: [bookings.resourceId],
    references: [resources.id],
  }),
  payments: one(payments, {
    fields: [bookings.id],
    references: [payments.bookingId],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const appointmentTypesRelations = relations(
  appointmentTypes,
  ({ many }) => ({
    bookings: many(bookings),
    comments: many(comments),
  })
);

export const resourcesRelations = relations(resources, ({ many }) => ({
  bookings: many(bookings),
}));

// ============================================
// TYPE EXPORTS
// ============================================

// Existing types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

// Appointment system types
export type AppointmentType = typeof appointmentTypes.$inferSelect;
export type NewAppointmentType = typeof appointmentTypes.$inferInsert;
export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
export type AppointmentTypeResource =
  typeof appointmentTypeResources.$inferSelect;
export type NewAppointmentTypeResource =
  typeof appointmentTypeResources.$inferInsert;
export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type BookingAnswer = typeof bookingAnswers.$inferSelect;
export type NewBookingAnswer = typeof bookingAnswers.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

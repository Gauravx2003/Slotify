/**
 * Admin Dashboard Module - Type Definitions
 * Types for admin dashboard statistics and user management
 */

// ============================================
// DASHBOARD STATISTICS TYPES
// ============================================

/**
 * Overall system statistics for admin dashboard
 */
export interface DashboardStats {
    totalUsers: number;
    totalCustomers: number;
    totalOrganisers: number;
    totalAdmins: number;
    totalAppointments: number;
    totalBookings: number;
    activeBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    pendingBookings: number;
}

/**
 * User statistics breakdown by role
 */
export interface UserStats {
    total: number;
    byRole: {
        customer: number;
        organiser: number;
        admin: number;
    };
    activeUsers: number;
    inactiveUsers: number;
    verifiedUsers: number;
    unverifiedUsers: number;
}

/**
 * Appointment statistics
 */
export interface AppointmentStats {
    total: number;
    published: number;
    unpublished: number;
    byOwner: Array<{
        ownerId: string;
        ownerName: string;
        count: number;
    }>;
}

/**
 * Booking statistics with breakdown
 */
export interface BookingStats {
    total: number;
    byStatus: {
        request: number;
        booked: number;
        cancelled: number;
        completed: number;
    };
    todayBookings: number;
    upcomingBookings: number;
}

// ============================================
// USER MANAGEMENT TYPES
// ============================================

/**
 * User listing options
 */
export interface UserListOptions {
    page: number;
    limit: number;
    role?: 'customer' | 'organiser' | 'admin';
    isActive?: boolean;
    search?: string;
}

/**
 * User status update payload
 */
export interface UpdateUserStatusPayload {
    isActive: boolean;
}

/**
 * User role update payload
 */
export interface UpdateUserRolePayload {
    role: 'customer' | 'organiser' | 'admin';
}

/**
 * User summary for admin list view
 */
export interface UserSummary {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    emailVerified: boolean;
    createdAt: Date;
    appointmentsCount?: number;
    bookingsCount?: number;
}

// ============================================
// APPOINTMENT LIST TYPES
// ============================================

/**
 * Appointment listing options
 */
export interface AppointmentListOptions {
    page: number;
    limit: number;
    isPublished?: boolean;
    search?: string;
}

/**
 * Appointment summary for admin list view
 */
export interface AppointmentSummary {
    id: string;
    ownerId: string;
    title: string;
    description: string | null;
    durationMinutes: number;
    location: string | null;
    isPublished: boolean;
    isPaid: boolean;
    bookingFeeCents: number | null;
    maxCapacity: number;
    cancellationHours: number;
    createdAt: Date;
    updatedAt: Date;
    owner?: {
        id: string;
        name: string;
        email: string;
    };
    bookingsCount: number;
}

// ============================================
// BOOKING LIST TYPES
// ============================================

/**
 * Booking listing options
 */
export interface BookingListOptions {
    page: number;
    limit: number;
    status?: 'request' | 'booked' | 'cancelled' | 'completed';
    search?: string;
    fromDate?: Date;
    toDate?: Date;
}

/**
 * Booking summary for admin list view
 */
export interface BookingSummary {
    id: string;
    appointmentTypeId: string;
    resourceId: string | null;
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    startTime: Date;
    endTime: Date;
    status: string;
    numPeople: number;
    subject: string | null;
    createdAt: Date;
    updatedAt: Date;
    appointmentType?: {
        id: string;
        title: string;
        owner?: {
            id: string;
            name: string;
            email: string;
        };
    };
}

// ============================================
// ANALYTICS TYPES
// ============================================

/**
 * Peak hours analytics
 */
export interface PeakHoursData {
    hour: number;
    bookingsCount: number;
}

/**
 * Provider utilization data
 */
export interface ProviderUtilization {
    providerId: string;
    providerName: string;
    totalSlots: number;
    bookedSlots: number;
    utilizationPercent: number;
}

// ============================================
// ROLE CONSTANTS
// ============================================

export const USER_ROLES = ['customer', 'organiser', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const BOOKING_STATUSES = ['request', 'booked', 'cancelled', 'completed'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

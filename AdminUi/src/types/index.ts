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

export interface AppointmentStats {
    total: number;
    published: number;
    unpublished: number;
    byOwner: {
        ownerId: string;
        ownerName: string;
        count: number;
    }[];
}

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

export interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    role: 'customer' | 'organiser' | 'admin';
    isActive: boolean;
    phone: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface UserSummary {
    id: string;
    name: string;
    email: string;
    role: 'customer' | 'organiser' | 'admin';
    isActive: boolean;
    emailVerified: boolean;
    createdAt: string;
    appointmentsCount: number;
    bookingsCount: number;
}

export type UserSummaryType = UserSummary;

export interface PeakHourData {
    hour: number;
    bookingsCount: number;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    meta?: {
        timestamp: string;
        pagination?: Pagination;
    };
}

export interface ErrorResponse {
    success: boolean;
    error: {
        type: string;
        message: string;
        statusCode: number;
        details?: {
            field: string;
            message: string;
        }[];
    };
}

// Appointment Types
export interface AppointmentType {
    id: string;
    ownerId: string;
    title: string;
    description: string | null;
    durationMinutes: number;
    location: string | null;
    assignmentType: string;
    isPublished: boolean;
    isPaid: boolean;
    bookingFeeCents: number | null;
    manageCapacity: boolean;
    maxCapacity: number;
    manualConfirmation: boolean;
    cancellationHours: number;
    slotCreationMode: string;
    shareToken: string | null;
    introMessage: string | null;
    confirmationMessage: string | null;
    createdAt: string;
    updatedAt: string;
    owner?: {
        id: string;
        name: string;
        email: string;
    };
    bookingsCount?: number;
}

// Booking
export interface Booking {
    id: string;
    appointmentTypeId: string;
    resourceId: string | null;
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    startTime: string;
    endTime: string;
    status: 'request' | 'booked' | 'cancelled' | 'completed';
    numPeople: number;
    subject: string | null;
    createdAt: string;
    updatedAt: string;
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

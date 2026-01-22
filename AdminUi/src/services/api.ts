import axios from 'axios';
import type {
    DashboardStats,
    UserStats,
    AppointmentStats,
    BookingStats,
    UserSummary,
    User,
    PeakHourData,
    ApiResponse,
    Pagination
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: `${API_URL}/admin`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Important for session cookies
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('admin_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Types for paginated responses
interface UserListResponse extends ApiResponse<UserSummary[]> {
    meta?: {
        timestamp: string;
        pagination?: Pagination;
    };
}

// Appointment type from database
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

// Booking type from database
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

export const adminApi = {
    // Dashboard stats
    getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
        const response = await api.get<ApiResponse<DashboardStats>>('/dashboard');
        return response.data;
    },

    // User stats
    getUserStats: async (): Promise<ApiResponse<UserStats>> => {
        const response = await api.get<ApiResponse<UserStats>>('/stats/users');
        return response.data;
    },

    // Appointment stats
    getAppointmentStats: async (): Promise<ApiResponse<AppointmentStats>> => {
        const response = await api.get<ApiResponse<AppointmentStats>>('/stats/appointments');
        return response.data;
    },

    // Booking stats
    getBookingStats: async (): Promise<ApiResponse<BookingStats>> => {
        const response = await api.get<ApiResponse<BookingStats>>('/stats/bookings');
        return response.data;
    },

    // Users list with pagination
    getUsers: async (params: { 
        page?: number; 
        limit?: number; 
        role?: string; 
        isActive?: boolean; 
        search?: string 
    }): Promise<UserListResponse> => {
        const response = await api.get<UserListResponse>('/users', { params });
        return response.data;
    },

    // Get single user
    getUserById: async (id: string): Promise<ApiResponse<User>> => {
        const response = await api.get<ApiResponse<User>>(`/users/${id}`);
        return response.data;
    },

    // Update user status
    updateUserStatus: async (id: string, isActive: boolean): Promise<ApiResponse<User>> => {
        const response = await api.patch<ApiResponse<User>>(`/users/${id}/status`, { isActive });
        return response.data;
    },

    // Update user role
    updateUserRole: async (id: string, role: string): Promise<ApiResponse<User>> => {
        const response = await api.patch<ApiResponse<User>>(`/users/${id}/role`, { role });
        return response.data;
    },

    // Peak hours analytics
    getPeakHours: async (): Promise<ApiResponse<PeakHourData[]>> => {
        const response = await api.get<ApiResponse<PeakHourData[]>>('/analytics/peak-hours');
        return response.data;
    },

    // Get all appointments (appointment types)
    getAppointments: async (params?: {
        page?: number;
        limit?: number;
        isPublished?: boolean;
        search?: string;
    }): Promise<ApiResponse<AppointmentType[]> & { meta?: { pagination?: Pagination } }> => {
        const response = await api.get('/appointments', { params });
        return response.data;
    },

    // Get all bookings
    getBookings: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<ApiResponse<Booking[]> & { meta?: { pagination?: Pagination } }> => {
        const response = await api.get('/bookings', { params });
        return response.data;
    },

    // Update booking status
    updateBookingStatus: async (id: string, status: string): Promise<ApiResponse<Booking>> => {
        const response = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/status`, { status });
        return response.data;
    },
};

export default api;

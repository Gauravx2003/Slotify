export interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthResponse {
    success: boolean;
    message?: string;
    data?: {
        user?: User;
        token?: string;
    };
}

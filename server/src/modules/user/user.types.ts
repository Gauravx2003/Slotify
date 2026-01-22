export interface UserProfile {
    id: string;
    name: string;
    email: string;
    image: string | null;
    updatedAt: Date;
}

export interface UpdateProfileRequest {
    name?: string;
    email?: string;
}

export interface UserResponse {
    success: boolean;
    message?: string;
    data?: {
        user?: UserProfile;
    };
}

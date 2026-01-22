export interface OTPRequest {
    email: string;
}

export interface OTPVerifyRequest {
    email: string;
    otp: string;
}

export interface OTPResponse {
    success: boolean;
    message: string;
}

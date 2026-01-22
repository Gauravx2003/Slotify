import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Generate 6-digit OTP
export function generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
}

// Send OTP via email or log to console
export async function sendOTP(email: string, otp: string): Promise<void> {
    const enableOTP = process.env.ENABLE_OTP === 'true';

    if (!enableOTP) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 OTP for ${email}: ${otp}`);
        console.log('(Email sending disabled - ENABLE_OTP=false)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return;
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    // Send email
    await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@app.com',
        to: email,
        subject: "Your Verification Code - Jaimin's App",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0ea5e9;">Verify Your Email</h2>
                <p>Hello,</p>
                <p>Your verification code is:</p>
                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0369a1;">${otp}</span>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
            </div>
        `,
    });

    console.log(`📧 OTP sent to ${email}`);
}

/**
 * Send OTP email for signup verification
 */
export async function sendOTPEmail(email: string, otp: string, name: string): Promise<void> {
    const enableOTP = process.env.ENABLE_OTP === 'true';

    if (!enableOTP) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 OTP for ${email} (${name}): ${otp}`);
        console.log('(Email sending disabled - ENABLE_OTP=false)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@app.com',
        to: email,
        subject: 'Verify Your Email - Appointment Booking System',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0ea5e9;">Welcome ${name}!</h2>
                <p>Thank you for signing up. Please verify your email address to complete your registration.</p>
                <p>Your verification code is:</p>
                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0369a1;">${otp}</span>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't create an account, please ignore this email.</p>
            </div>
        `,
    });

    console.log(`📧 Signup OTP sent to ${email}`);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetToken: string, name: string): Promise<void> {
    const enableOTP = process.env.ENABLE_OTP === 'true';
    // Use CLIENT_URL from env or default to localhost:5173
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

    if (!enableOTP) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🔑 Password Reset Token for ${email} (${name}): ${resetToken}`);
        console.log(`🔗 Link: ${resetLink}`);
        console.log('(Email sending disabled - ENABLE_OTP=false)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@app.com',
        to: email,
        subject: 'Reset Your Password - Slotify',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
                <h2 style="color: #c2410c; text-align: center; margin-bottom: 24px;">Password Reset Request</h2>
                <p style="color: #475569; font-size: 16px; line-height: 1.5;">Hello ${name},</p>
                <p style="color: #475569; font-size: 16px; line-height: 1.5;">We received a request to reset your password. Click the button below to reset it:</p>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${resetLink}" style="background-color: #c2410c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
                </div>

                <p style="color: #64748b; font-size: 14px; text-align: center;">Or verify using this code: <strong>${resetToken}</strong></p>
                
                <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; text-align: center;">This link will expire in 30 minutes.</p>
                <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you didn't request a password reset, please ignore this email.</p>
            </div>
        `,
    });

    console.log(`🔑 Password reset email sent to ${email}`);
}


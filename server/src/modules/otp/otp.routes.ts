import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../../db';
import { verifications, users, accounts } from '../../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { redisHelpers } from '../../config/redis';
import { generateOTP, sendOTP } from './otp.service';

const router = Router();

// Send OTP endpoint
router.post('/send-otp', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Check if user exists
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in verifications table
        await db.insert(verifications).values({
            id: crypto.randomBytes(16).toString('hex'),
            identifier: email,
            value: otp,
            expiresAt,
        });

        // Also cache in Redis for quick lookup
        await redisHelpers.set(`otp:${email}`, otp, 600); // 10 minutes

        // Send OTP
        await sendOTP(email, otp);

        res.json({
            success: true,
            message: 'OTP sent successfully',
        });
    } catch (error) {
        console.error('Error sending OTP:', error);
        next(error);
    }
});

// Verify OTP endpoint
router.post('/verify-otp', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        // Check Redis first
        const cachedOTP = await redisHelpers.get(`otp:${email}`);

        let isValid = false;

        if (cachedOTP === otp) {
            isValid = true;
            await redisHelpers.delete(`otp:${email}`);
        } else {
            // Check database
            const verification = await db.query.verifications.findFirst({
                where: and(
                    eq(verifications.identifier, email),
                    eq(verifications.value, otp),
                    gt(verifications.expiresAt, new Date())
                ),
            });

            if (verification) {
                isValid = true;
                // Delete used OTP
                await db.delete(verifications).where(eq(verifications.id, verification.id));
            }
        }

        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Mark email as verified and get user info
        const updatedUsers = await db.update(users)
            .set({ emailVerified: true, updatedAt: new Date() })
            .where(eq(users.email, email))
            .returning();

        const user = updatedUsers[0];

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            message: 'Email verified successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        next(error);
    }
});

// Resend OTP endpoint
router.post('/resend-otp', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Delete existing OTPs for this email
        await db.delete(verifications).where(eq(verifications.identifier, email));
        await redisHelpers.delete(`otp:${email}`);

        // Generate new OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Store OTP
        await db.insert(verifications).values({
            id: crypto.randomBytes(16).toString('hex'),
            identifier: email,
            value: otp,
            expiresAt,
        });

        await redisHelpers.set(`otp:${email}`, otp, 600);

        // Send OTP
        await sendOTP(email, otp);

        res.json({
            success: true,
            message: 'OTP resent successfully',
        });
    } catch (error) {
        console.error('Error resending OTP:', error);
        next(error);
    }
});

// Custom Forget Password Endpoint
router.post('/forget-password', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, redirectTo } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Check if user exists
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            // Return success even if user not found (security best practice)
            return res.json({
                success: true,
                message: 'If an account exists with this email, you will receive a password reset link',
            });
        }

        // Generate 6-digit reset token
        const resetToken = generateOTP();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        // Delete any existing reset tokens for this email
        await db.delete(verifications).where(eq(verifications.identifier, `reset:${email}`));

        // Store reset token in verifications table
        await db.insert(verifications).values({
            id: crypto.randomBytes(16).toString('hex'),
            identifier: `reset:${email}`, // prefix with 'reset:' to distinguish from OTP verifications
            value: resetToken,
            expiresAt,
        });

        // Cache in Redis
        await redisHelpers.set(`reset:${email}`, resetToken, 1800); // 30 minutes

        // Import the sendPasswordResetEmail function
        const { sendPasswordResetEmail } = await import('./otp.service');

        // Send password reset email with the token
        await sendPasswordResetEmail(email, resetToken, user.name);

        res.json({
            success: true,
            message: 'Password reset link sent to your email',
        });

    } catch (error: any) {
        console.error('Error in forget-password:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
});

// Custom Reset Password Endpoint
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Token and new password are required' });
        }

        // Find all reset verifications and check if token matches any
        const allResetVerifications = await db.query.verifications.findMany({
            where: gt(verifications.expiresAt, new Date()),
        });

        const verification = allResetVerifications.find(v =>
            v.identifier.startsWith('reset:') && v.value === token
        );

        if (!verification) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        // Extract email from identifier (format: "reset:email@example.com")
        const email = verification.identifier.replace('reset:', '');

        // Get user
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Find the credential account for this user
        const account = await db.query.accounts.findFirst({
            where: and(
                eq(accounts.userId, user.id),
                eq(accounts.providerId, 'credential')
            )
        });

        if (!account) {
            console.error(`❌ No credential account found for user ${user.id} (${email})`);
            return res.status(404).json({ success: false, message: 'Account configuration error. Please contact support.' });
        }

        console.log(`🔄 Resetting password for user: ${email}, account ID: ${account.id}`);

        // Hash the new password using bcrypt (same as seed-admin.ts)
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in accounts table using the account ID
        const updateResult = await db.update(accounts)
            .set({
                password: hashedPassword,
                updatedAt: new Date()
            })
            .where(eq(accounts.id, account.id))
            .returning({ id: accounts.id });

        if (!updateResult || updateResult.length === 0) {
            console.error(`❌ Failed to update password for account ${account.id}`);
            return res.status(500).json({ success: false, message: 'Failed to update password' });
        }

        console.log(`✅ Password reset successful for ${email}`);

        // Delete the used reset token
        await db.delete(verifications).where(eq(verifications.id, verification.id));
        await redisHelpers.delete(`reset:${email}`);

        res.json({
            success: true,
            message: 'Password has been reset successfully',
        });

    } catch (error: any) {
        console.error('❌ Error in reset-password:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
});

export default router;

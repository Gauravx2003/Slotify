import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, emailOTP } from "better-auth/plugins";
import { db } from "../db";
import * as schema from "../db/schema";
import {
  sendOTPEmail,
  sendPasswordResetEmail,
} from "../modules/otp/otp.service";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET environment variable is required");
}

if (!process.env.BETTER_AUTH_URL) {
  throw new Error("BETTER_AUTH_URL environment variable is required");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  // Define additional user fields to include in responses
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: true, // Allow setting on signup
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false, // Don't allow setting on signup
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // We handle verification with emailOTP plugin
    password: {
      // Use bcrypt for password hashing (compatible with seed scripts)
      hash: async (password: string) => {
        const bcrypt = (await import("bcryptjs")).default;
        return bcrypt.hash(password, 10);
      },
      verify: async (data: { hash: string; password: string }) => {
        const bcrypt = (await import("bcryptjs")).default;
        return bcrypt.compare(data.password, data.hash);
      },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "customer",
        returned: true, // This ensures role is returned in auth responses
      },
      phone: {
        type: "string",
        required: false,
        returned: true,
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        returned: true,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: false, // Disable cookies - use Bearer tokens only
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  plugins: [
    // Bearer token plugin - enables Authorization: Bearer <token> authentication
    bearer(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Get user info for personalized emails
        const user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, email),
        });

        const userName = user?.name || "User";

        if (type === "sign-in") {
          // Send OTP for sign in
          await sendOTPEmail(email, otp, userName);
        } else if (type === "email-verification") {
          // Send OTP for email verification
          await sendOTPEmail(email, otp, userName);
        } else if (type === "forget-password") {
          // Send OTP for password reset
          await sendPasswordResetEmail(email, otp, userName);
        }
      },
      otpLength: 6,
      expiresIn: 600, // 10 minutes
      sendVerificationOnSignUp: true, // Auto-send OTP on signup
      disableSignUp: false, // Allow signup via OTP
      allowedAttempts: 5, // Allow 5 attempts before invalidating
    }),
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  // In development, allow all origins (for Postman/API testing)
  // In production, use the configured trusted origins
  trustedOrigins:
    process.env.NODE_ENV === "development"
      ? [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:3000",
          "http://127.0.0.1:5173",
          "http://127.0.0.1:5174",
          "http://127.0.0.1:3000",
        ]
      : process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") || [],
});

export type Auth = typeof auth;

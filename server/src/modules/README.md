# Modules Structure

This directory contains feature-based modules for the application. Each module is self-contained with its own routes, controllers, services, validators, and types.

## Structure

Each module follows this structure:
```
module-name/
├── module-name.controller.ts  # Business logic handlers
├── module-name.routes.ts      # Route definitions
├── module-name.service.ts     # Business logic services (optional)
├── module-name.validator.ts   # Validation schemas (optional)
├── module-name.types.ts       # TypeScript interfaces
└── index.ts                   # Module exports
```

## Available Modules

### Auth Module (`/modules/auth`)
Handles authentication-related operations:
- Get current user
- Update user profile
- Validators for auth operations

### User Module (`/modules/user`)
Handles user profile management:
- Update profile (name, email)
- Upload profile picture
- Delete profile picture
- Delete account

### OTP Module (`/modules/otp`)
Handles OTP (One-Time Password) operations:
- Send OTP
- Verify OTP
- Resend OTP

## Common Resources

Common resources are shared across modules:
- **Middleware** (`/middleware`): Authentication, validation, upload handlers
- **Utils** (`/utils`): Error handling, utility functions
- **Config** (`/config`): Configuration files (auth, redis, s3)
- **DB** (`/db`): Database schema and migrations

## Usage

Import from module index files:
```typescript
import { authRoutes, getCurrentUser } from '../modules/auth';
import { userRoutes, updateProfile } from '../modules/user';
import { otpRoutes, sendOTP } from '../modules/otp';
```

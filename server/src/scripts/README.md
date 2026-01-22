# Database Seed Scripts

This directory contains seed scripts for populating the database with initial data.

## Admin User Seed

Creates an admin user with predefined credentials for initial system access.

### Usage

```bash
yarn db:seed-admin
```

### Default Credentials

- **Email:** admin@gmail.com
- **Password:** admin123
- **Role:** admin

### Important Notes

1. **Change Password:** After first login, immediately change the admin password for security.
2. **Idempotent:** The script checks if the admin user already exists and will not create duplicates.
3. **Email Verified:** The admin user is created with `emailVerified: true` to allow immediate login.

### Script Details

The seed script:
- Generates a unique user ID
- Hashes the password using bcrypt (10 rounds)
- Creates a user record with admin role
- Creates an account record for better-auth email/password authentication
- Provides clear console output with the created user details

### Security Considerations

⚠️ **WARNING:** This script creates a user with a well-known password. This is intended for:
- Development environments
- Initial setup
- Testing purposes

**Never use default credentials in production!** Always:
1. Change the password immediately after first login
2. Use strong, unique passwords
3. Consider implementing additional security measures (2FA, IP restrictions, etc.)

## Manual Migration Script

If you need to manually add the required user columns (role, is_active, phone):

```bash
yarn tsx src/scripts/run-migration.ts
```

This script safely adds missing columns to the users table with proper checks to avoid errors.

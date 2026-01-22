# Odoo Hackathon Backend Server

A production-ready backend template built with Express.js, TypeScript, PostgreSQL, Redis, and AWS S3.

## 🚀 Features

### Core Technologies
- **Express.js 5** - Fast, modern web framework
- **TypeScript** - Type-safe development
- **PostgreSQL** - Robust relational database
- **Drizzle ORM** - Lightweight TypeScript ORM
- **Redis** - High-performance caching layer
- **AWS S3** - Scalable file storage

### Authentication & Authorization
- **Better Auth** - Modern authentication system
- Email/password authentication
- Session management with cookies
- Password reset functionality
- Secure token-based auth

### Advanced Features
- Comprehensive error handling for all error types
- File upload with AWS S3 integration
- Redis caching for improved performance
- Rate limiting protection
- Request validation with Zod
- Jest testing framework configured
- OpenAPI 3.0 documentation

## 📁 Project Structure

```
server/
├── src/
│   ├── __tests__/           # Test files
│   │   ├── utils/           # Test utilities
│   │   ├── setup.ts         # Test environment setup
│   │   ├── basic.test.ts    # Basic tests
│   │   └── example.test.ts  # Example test suite
│   ├── config/              # Configuration files
│   │   ├── auth.ts          # Better Auth configuration
│   │   ├── redis.ts         # Redis client setup
│   │   └── s3.ts            # AWS S3 configuration
│   ├── controllers/         # Request handlers
│   │   ├── auth.controller.ts
│   │   └── user.controller.ts
│   ├── db/                  # Database
│   │   ├── migrations/      # Database migrations
│   │   ├── index.ts         # Database connection
│   │   ├── migrate.ts       # Migration runner
│   │   └── schema.ts        # Database schema
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── upload.middleware.ts
│   ├── routes/              # API routes
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   └── error.ts         # Error handling system
│   ├── validators/          # Zod schemas
│   │   └── auth.validator.ts
│   ├── app.ts               # Express app setup
│   └── index.ts             # Server entry point
├── .env.example             # Environment variables template
├── drizzle.config.ts        # Drizzle ORM configuration
├── jest.config.js           # Jest configuration
├── package.json
└── tsconfig.json
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and Yarn
- PostgreSQL 14+
- Redis 6+
- AWS Account (for S3)

### Installation

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   
   **Required:**
   - `DATABASE_URL` - PostgreSQL connection string
   - `REDIS_URL` - Redis connection URL
   - `BETTER_AUTH_SECRET` - Min 32 characters (for session encryption)
   - `BETTER_AUTH_URL` - Your server URL (e.g., http://localhost:5000)
   - `AWS_ACCESS_KEY_ID` - AWS access key
   - `AWS_SECRET_ACCESS_KEY` - AWS secret key
   - `AWS_S3_BUCKET_NAME` - S3 bucket name

3. **Setup PostgreSQL:**
   Create a database:
   ```sql
   CREATE DATABASE odoo_hackathon;
   ```

4. **Run database migrations:**
   ```bash
   yarn db:generate
   yarn db:migrate
   ```

5. **Start Redis:**
   ```bash
   redis-server
   ```

### Development

Start the development server:
```bash
yarn dev
```

The server will be available at `http://localhost:5000`

**Console output:**
```
🔄 Connecting to Redis...
✅ Redis connected successfully
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Server running in development mode
📡 Listening on port 5000
🌐 API URL: http://localhost:5000/api
🔐 Better Auth: http://localhost:5000/api/auth
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Testing

Run all tests:
```bash
yarn test
```

Watch mode:
```bash
yarn test:watch
```

Coverage report:
```bash
yarn test:coverage
```

### Production Build

Build the TypeScript code:
```bash
yarn build
```

Start production server:
```bash
yarn start
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### User Management
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/profile-picture` - Upload profile picture
- `DELETE /api/user/profile-picture` - Delete profile picture
- `PUT /api/user/password` - Update password
- `DELETE /api/user/account` - Delete account

### Health Check
- `GET /api/health` - Server health status

See [OpenAPI documentation](../docs/apis/) for detailed API specifications.

## 🔧 Database Management

### Generate migration:
```bash
yarn db:generate
```

### Run migrations:
```bash
yarn db:migrate
```

### Push schema directly (development only):
```bash
yarn db:push
```

### Open Drizzle Studio:
```bash
yarn db:studio
```

## 🎯 Features Breakdown

### Error Handling
The application includes a comprehensive error handling system in `src/utils/error.ts`:

**Custom Error Classes:**
- `ValidationError` - Zod schema validation failures
- `AuthenticationError` - Invalid credentials, expired tokens
- `AuthorizationError` - Insufficient permissions
- `NotFoundError` - Resource not found
- `ConflictError` - Duplicate resources (e.g., email already exists)
- `DatabaseError` - PostgreSQL errors
- `RedisError` - Cache operation failures
- `S3Error` - File upload/delete failures
- `RateLimitError` - Too many requests

**Automatic Error Detection:**
- PostgreSQL constraint violations (unique, foreign key, not null)
- Zod validation errors
- JWT token errors
- Multer file upload errors
- All errors return consistent JSON responses

### Middleware
- **Authentication** - Session-based using Better Auth
- **Validation** - Request validation with Zod schemas
- **File Upload** - Multer with size/type restrictions (5MB max)
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Security** - Helmet for security headers
- **CORS** - Configurable cross-origin resource sharing
- **Compression** - Response compression

### Caching Strategy
Redis is used for:
- User data caching (1 hour TTL)
- Password reset tokens (1 hour expiry)
- Session management
- Rate limiting counters

### User Schema
```typescript
{
  id: UUID (auto-generated)
  name: string
  email: string (unique)
  hashPassword: string (bcrypt, 12 rounds)
  profilePicture: string | null (S3 URL)
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}
```

## 🧪 Testing

**Current Status:**
- ✅ Jest configured and working
- ✅ TypeScript compilation passes
- ✅ Example tests passing (8/8)

**Test Files:**
- `src/__tests__/basic.test.ts` - Basic functionality
- `src/__tests__/example.test.ts` - Comprehensive examples
- `src/__tests__/setup.ts` - Test environment configuration

**Note:** Integration tests require running PostgreSQL, Redis, and AWS S3/LocalStack.

Tests use:
- **Jest 29.x** - Testing framework
- **ts-jest** - TypeScript support  
- **Supertest** - HTTP assertion library (for integration tests)

## 🔐 Security

- **Password Hashing:** bcrypt with 12 rounds
- **Session Management:** HTTP-only cookies
- **Authentication:** Better Auth with secure sessions
- **Rate Limiting:** 100 requests per 15 minutes
- **File Upload:** Size (5MB) and type validation
- **Input Validation:** Zod schemas for all requests
- **SQL Injection Prevention:** Drizzle ORM parameterized queries
- **CORS:** Configurable allowed origins
- **Security Headers:** Helmet.js

## 📝 Environment Variables

See `.env.example` for all required environment variables.

**Key Variables:**

**Server:**
- `NODE_ENV` - development | production | test
- `PORT` - Server port (default: 5000)

**Database:**
- `DATABASE_URL` - PostgreSQL connection string

**Redis:**
- `REDIS_URL` - Redis connection URL
- `REDIS_PASSWORD` - Optional password
- `REDIS_DB` - Database number (default: 0)

**AWS S3:**
- `AWS_REGION` - AWS region
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_S3_BUCKET_NAME` - S3 bucket name
- `AWS_S3_PROFILE_FOLDER` - Folder for profile pictures

**Better Auth:**
- `BETTER_AUTH_SECRET` - Min 32 characters for session encryption
- `BETTER_AUTH_URL` - Base URL of your server (for redirects, email links)
- `BETTER_AUTH_TRUSTED_ORIGINS` - Comma-separated allowed origins

**JWT:**
- `JWT_SECRET` - JWT signing key
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)

**CORS:**
- `CORS_ORIGIN` - Allowed origins (comma-separated)

**Rate Limiting:**
- `RATE_LIMIT_WINDOW_MS` - Time window (default: 900000 = 15 min)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

**File Upload:**
- `MAX_FILE_SIZE` - Max file size in bytes (default: 5242880 = 5MB)
- `ALLOWED_FILE_TYPES` - Comma-separated MIME types

## 🚦 Available Scripts

```bash
# Development
yarn dev              # Start dev server with hot reload

# Database
yarn db:generate      # Generate migrations
yarn db:migrate       # Run migrations
yarn db:push          # Push schema (dev only)
yarn db:studio        # Open Drizzle Studio

# Testing
yarn test             # Run all tests
yarn test:watch       # Watch mode
yarn test:coverage    # Coverage report

# Production
yarn build            # Build TypeScript
yarn start            # Start production server
```

## 📄 License

ISC

## 👥 Author

Jaimin Detroja

import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./utils/error";
import { auth } from "./config/auth";

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration - allow all origins in development for Postman testing
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "development"
        ? true
        : process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// In development, add Origin header for requests without one (for Postman)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    if (!req.headers.origin) {
      req.headers.origin = "http://localhost:3000";
    }
    next();
  });
}

// Request logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Body parsing middleware - must be first for logging to work
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// COMPREHENSIVE REQUEST LOGGING
app.use((req, res, next) => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📥 ${req.method} ${req.url}`);
  if (req.body) {
    // filter out sensitive fields
    const bodyLog = { ...req.body };
    if (bodyLog.password) bodyLog.password = "[HIDDEN]";
    console.log("Body:", JSON.stringify(bodyLog, null, 2));
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  next();
});

// Better Auth API routes - Express 5 syntax uses *splat
app.all("/api/auth/*splat", toNodeHandler(auth));

// Compression middleware
app.use(compression());

// Rate limiting - increased for real-time booking operations
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 500, // Increased from 100 to 500
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain high-frequency real-time endpoints
  skip: (req) => {
    // Skip rate limiting for slot hold/release endpoints to allow real-time booking
    const skipPaths = ['/api/bookings/hold', '/release', '/confirm-hold'];
    return skipPaths.some(path => req.path.includes(path));
  },
});

app.use("/api", limiter);

// API routes (custom routes)
app.use("/api", routes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Odoo Hackathon API",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      user: "/api/user",
    },
  });
});

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

export default app;

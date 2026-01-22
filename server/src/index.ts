import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import app from "./app";
import { connectRedis } from "./config/redis";
import { initializeSocketIO } from "./config/socket";

// Load environment variables

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

async function startServer() {
  try {
    // Connect to Redis
    console.log("🔄 Connecting to Redis...");
    await connectRedis();

    // Create HTTP server with Express app
    const httpServer = createServer(app);

    // Initialize Socket.IO
    initializeSocketIO(httpServer);

    // Start periodic cleanup of expired slot holds
    // For testing: 30 second interval, 1 minute timeout
    const HOLD_CLEANUP_INTERVAL = 30 * 1000; // 30 seconds for testing (change to 5 * 60 * 1000 for production)
    const HOLD_TIMEOUT_MINUTES = 1; // 1 minute for testing (change to 10 for production)

    setInterval(async () => {
      console.log("⏰ Running expired holds cleanup check...");
      try {
        const { BookingService } = await import(
          "./modules/bookings/booking.service"
        );
        const bookingService = new BookingService();
        const releasedCount = await bookingService.cleanupExpiredHolds(
          HOLD_TIMEOUT_MINUTES
        );
        console.log(
          `⏰ Cleanup complete: ${releasedCount} expired holds released`
        );
      } catch (err) {
        console.error("Error during expired holds cleanup:", err);
      }
    }, HOLD_CLEANUP_INTERVAL);

    console.log(
      `⏰ Slot hold cleanup scheduled (every ${
        HOLD_CLEANUP_INTERVAL / 1000
      } sec, timeout: ${HOLD_TIMEOUT_MINUTES} min)`
    );

    // Start HTTP server
    const server = httpServer.listen(PORT, () => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`🚀 Server running in ${NODE_ENV} mode`);
      console.log(`📡 Listening on port ${PORT}`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api`);
      console.log(`🔐 Better Auth: http://localhost:${PORT}/api/auth`);
      console.log(`🔌 Socket.IO: ws://localhost:${PORT}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      console.log(
        "\n🛑 Received shutdown signal, closing server gracefully..."
      );

      server.close(async () => {
        console.log("✅ HTTP server closed");

        try {
          const { disconnectRedis } = await import("./config/redis");
          await disconnectRedis();
          console.log("✅ Redis connection closed");
        } catch (error) {
          console.error("Error closing Redis:", error);
        }

        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error("⚠️  Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

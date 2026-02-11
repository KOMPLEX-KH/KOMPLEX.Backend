import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { redis } from "./db/redis/redisConfig.js";

import routes from "./app/api/v2/komplex/routes/index.js";
import adminRoutes from "./app/api/v2/komplex-admin/routes/index.js";
import { globalRateLimiter } from "./middleware/redisLimiter.js";
import { seedDb, seedSearch } from "./seed/seedFunction.js";
import { db } from "./db/index.js";
import { sql } from "drizzle-orm";
dotenv.config();

const app = express();

try {
  await redis.connect();
  console.log("Redis connected:", redis.isOpen);
  const PORT = process.env.PORT || 6000;

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? "Set" : "NOT SET"}`);
  });
} catch (err) {
  console.error("Failed to connect to Redis:", err);
}
// middleware

// Enhanced error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error("🚨 Express Error Middleware:");
  console.error("Error:", err);
  console.error("Stack trace:", err.stack);
  console.error("Request URL:", req.url);
  console.error("Request method:", req.method);
  console.error("Request body:", req.body);
  console.error("Request params:", req.params);
  console.error("Request query:", req.query);

  res.status(500).json({
    message: "Internal Server Error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN as string,
      "http://localhost:3000",
      "http://localhost:4000",
    ],
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));

app.use(globalRateLimiter);
app.get("/ping", async (req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.status(200).send("pong");
  } catch (err) {
    console.error("Ping failed:", (err as Error).message);
    res.status(500).send("ping failed");
  }
});

app.use("/api/", routes);
app.use("/api/admin", adminRoutes);

// seedDb

app.get("/seedDb", seedDb);

// seedSearch

app.get("/seedSearch", seedSearch);

// connection

// Global error handlers for uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("🚨 UNCAUGHT EXCEPTION:", error);
  console.error("Stack trace:", error.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 UNHANDLED REJECTION at:", promise);
  console.error("Reason:", reason);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  process.exit(0);
});

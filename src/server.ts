import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { redis } from "./db/redis/redisConfig.js";
import routes from "./app/route.js";
import { globalRateLimiter } from "./middleware/rateLimiter.js";
import { generateAdminOpenAPIDocument, generateUserOpenAPIDocument, userApiRegistry } from "./config/openapi/swagger.js";
import swaggerUi from "swagger-ui-express";

dotenv.config();

const app = express();

// ! INIT APP =================================

try {
  await redis.connect();
  console.log("Redis connected:", redis.isOpen);
  const PORT = process.env.PORT || 6000;

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.ENVIRONMENT || "development"}`);
    console.log(`JWT Secret: ${process.env.JWT_SECRET ? "Set" : "NOT SET"}`);
  });
} catch (err) {
  console.error("Failed" + err);
}

// ! MIDDLEWARE =================================

// Enhanced error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(" Express Error Middleware:");
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
      process.env.ENVIRONMENT === "development"
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

app.use("/docs/user", swaggerUi.serve, swaggerUi.setup(null, {
  swaggerOptions: { url: "/open.json" }
}));
app.use("/docs/admin", swaggerUi.serve, swaggerUi.setup(null, {
  swaggerOptions: { url: "/open-admin.json" }
}));


app.use(morgan(process.env.ENVIRONMENT === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(globalRateLimiter);

// ! ROUTE =================================

app.get("/ping", async (req, res) => {
  try {
    res.status(200).send("pong");
  } catch (err) {
    res.status(500).send("ping failed");
  }
});

app.use("/", routes);

// Documentation

app.get("/open.json", (req, res) => {
  res.json(generateUserOpenAPIDocument());
});
app.get("/open-admin.json", (req, res) => {
  res.json(generateAdminOpenAPIDocument());
});

// ! ERROR HANDLERS =================================

process.on("uncaughtException", (error) => {
  console.error(" UNCAUGHT EXCEPTION:", error);
  console.error("Stack trace:", error.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(" UNHANDLED REJECTION at:", promise);
  console.error("Reason:", reason);
  process.exit(1);
});

// ! GRACEFUL SHUTDOWN =================================

process.on("SIGTERM", () => {
  console.log(" SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log(" SIGINT received, shutting down gracefully");
  process.exit(0);
});

// !===========================================
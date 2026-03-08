import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./app/route.js";
import { globalRateLimiter } from "./middleware/rateLimiter.js";
import {
  generateAdminOpenAPIDocument,
  generateUserOpenAPIDocument,
} from "./config/openapi/swagger.js";
import swaggerUi from "swagger-ui-express";

const isProduction = process.env.ENVIRONMENT === "production";

/**
 * Creates and returns the Express app (middleware + routes).
 * Used by server.ts to listen and by tests for integration testing.
 */
export function createApp() {
  const app = express();

  // Error handling middleware (must be early for errors in other middleware)
  app.use((err: any, req: any, res: any, _next: any) => {
    console.error(" Express Error Middleware:", err?.message);
    res.status(500).json({
      message: "Internal Server Error",
      error: !isProduction ? err?.message : "Something went wrong",
    });
  });

  app.use(
    cors({
      origin: isProduction ? [process.env.CORS_ORIGIN as string] : "*",
      credentials: true,
    })
  );

  if (!isProduction) {
    app.use(
      "/docs",
      swaggerUi.serve,
      swaggerUi.setup(null, { swaggerOptions: { url: "/open.json" } })
    );
  }

  app.use(morgan(isProduction ? "combined" : "dev"));
  app.use(express.json({ limit: "10mb" }));
  app.use(globalRateLimiter);

  app.get("/ping", async (_req, res) => {
    try {
      res.status(200).send("pong");
    } catch {
      res.status(500).send("ping failed");
    }
  });

  app.use("/", routes);

  app.get("/open.json", (_req, res) => {
    res.json(generateUserOpenAPIDocument());
  });

  if (!isProduction) {
    app.get("/open-admin.json", (_req, res) => {
      res.json(generateAdminOpenAPIDocument());
    });
  }

  return app;
}

import dotenv from "dotenv";
import { redis } from "./db/redis/redis.js";
import { createApp } from "./app.js";
import path from "path";
import { fileURLToPath } from "url";
// top of index.mjs
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const protoPath = path.join(__dirname, "../ai.proto");

try {
  await redis.connect();
  console.log("Redis connected:", redis.isOpen);
  const PORT = process.env.PORT || 6000;
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.ENVIRONMENT || "development"}`);
    console.log(`JWT Secret: ${process.env.JWT_SECRET ? "Set" : "NOT SET"}`);
  });
} catch (err) {
  console.error("Failed", err);
}

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

process.on("SIGTERM", () => {
  console.log(" SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log(" SIGINT received, shutting down gracefully");
  process.exit(0);
});



type AiGrpcDefinition = grpc.GrpcObject & {
  ai: grpc.GrpcObject & {
    AIService: grpc.ServiceClientConstructor;
  };
};

const packageDef = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const grpcObject = grpc.loadPackageDefinition(packageDef) as AiGrpcDefinition;

if (!grpcObject.ai?.AIService) {
  throw new Error("AIService not found in loaded gRPC package definition");
}

export const grpcClient = new grpcObject.ai.AIService(
  process.env.DARA_GRPC_URL ?? 'localhost:50051',
  grpc.credentials.createInsecure()
);
import path from "path";
import { fileURLToPath } from "url";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import type { AiGrpcDefinition } from "@/types/grpc.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const protoPath = path.join(__dirname, "../../ai.proto");

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
  process.env.DARA_GRPC_URL ?? "localhost:50051",
  grpc.credentials.createInsecure()
);

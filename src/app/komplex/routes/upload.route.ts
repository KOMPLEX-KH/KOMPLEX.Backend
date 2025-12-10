import { Router } from "express";
import { getSignedUrl } from "../controllers/upload.controller.js";
import { verifyFirebaseTokenAdmin, verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import { postVideoRateLimiter } from "@/middleware/redisLimiter.js";

const router = Router();

router.post(
  "/upload-url",
  verifyFirebaseTokenAdmin as any,
  postVideoRateLimiter,
  getSignedUrl as any
);

export default router;

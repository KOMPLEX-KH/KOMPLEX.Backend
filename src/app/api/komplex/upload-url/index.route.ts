import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import { postVideoRateLimiter } from "@/middleware/rateLimiter.js";
import { postUploadUrl } from "../upload-url/post.js";

const router = Router();

// ============================================================================
// Upload Routes
// ============================================================================
router.post(
    "/upload-url",
    verifyFirebaseTokenAdmin as any,
    postVideoRateLimiter,
    postUploadUrl as any
);

export default router;

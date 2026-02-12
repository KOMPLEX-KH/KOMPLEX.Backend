import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import { postSmallRateLimiter } from "@/middleware/rateLimiter.js";
import { postFeedback } from "../../me/feedback/post.js";

const router = Router();

// ============================================================================
// Me Feedback Routes
// ============================================================================
router.post("", verifyFirebaseToken as any, postSmallRateLimiter, postFeedback as any);

export default router;

import Router from "express";
import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import { getSmallContentRateLimiter } from "@/middleware/rateLimiter.js";
import { getAllNews } from "../../feed/news/get.js";
import { getNewsById } from "../../feed/news/[id]/get.js";

const router = Router();

// ============================================================================
// Feed News Routes
// ============================================================================
router.get("", verifyFirebaseTokenOptional as any, getSmallContentRateLimiter, getAllNews as any);
router.get("/:id", verifyFirebaseTokenOptional as any, getSmallContentRateLimiter, getNewsById as any);

export default router;

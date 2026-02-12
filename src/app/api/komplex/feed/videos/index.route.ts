import Router from "express";
import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import { getVideoRateLimiter } from "@/middleware/rateLimiter.js";
import { getAllVideos } from "../../feed/videos/get.js";
import { getVideoById } from "../../feed/videos/[id]/get.js";
import { getRecommendedVideos } from "../../feed/videos/[id]/recommended/get.js";
import { getVideoLikes } from "../../feed/videos/[id]/likes/get.js";
import { getVideoComments } from "../../feed/videos/[id]/comments/get.js";
import { getVideoReplies } from "../../feed/videos/[id]/comments/[id]/replies/get.js";

const router = Router();

// ============================================================================
// Feed Videos Routes
// ============================================================================
router.get("", verifyFirebaseTokenOptional as any, getVideoRateLimiter, getAllVideos as any);
router.get("/:id", verifyFirebaseTokenOptional as any, getVideoRateLimiter, getVideoById as any);
router.get(
    "/:id/recommended",
    verifyFirebaseTokenOptional as any,
    getVideoRateLimiter,
    getRecommendedVideos as any
);
router.get("/:id/likes", getVideoLikes as any);
router.get("/:id/comments", getVideoComments as any);
router.get("/:id/comments/:id/replies", getVideoReplies as any);

export default router;

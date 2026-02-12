import Router from "express";
import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import {
    getSmallContentRateLimiter,
    getVideoRateLimiter,
    getBigContentRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getUserProfile } from "../users/[id]/profile/get.js";
import { getUserVideos } from "../users/[id]/videos/get.js";
import { getUserForums } from "../users/[id]/forums/get.js";

const router = Router();

// ============================================================================
// Users Routes
// ============================================================================
router.get(
    "/:id/profile",
    verifyFirebaseTokenOptional as any,
    getSmallContentRateLimiter,
    getUserProfile as any
);
router.get(
    "/:id/videos",
    verifyFirebaseTokenOptional as any,
    getVideoRateLimiter,
    getUserVideos as any
);
router.get(
    "/:id/forums",
    verifyFirebaseTokenOptional as any,
    getBigContentRateLimiter,
    getUserForums as any
);

export default router;

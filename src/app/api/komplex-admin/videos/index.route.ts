import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import { adminGetVideoRateLimiter } from "@/middleware/rateLimiter.js";
import { getAllVideos as getAllAdminVideos } from "../videos/get.js";
import { getVideoById as getAdminVideoById } from "../videos/[id]/get.js";

const router = Router();

// ============================================================================
// Admin Videos Routes
// ============================================================================
router.get("", verifyFirebaseTokenAdmin as any, adminGetVideoRateLimiter, getAllAdminVideos as any);
router.get(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminGetVideoRateLimiter,
    getAdminVideoById as any
);

export default router;

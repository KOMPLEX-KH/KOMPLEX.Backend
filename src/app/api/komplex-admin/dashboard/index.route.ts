import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import { adminGetBigContentRateLimiter } from "@/middleware/rateLimiter.js";
import { getDashboard } from "../dashboard/get.js";

const router = Router();

// ============================================================================
// Admin Dashboard Routes
// ============================================================================
router.get(
    "",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getDashboard as any
);

export default router;

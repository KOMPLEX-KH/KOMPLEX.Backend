import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import { adminGetSmallContentRateLimiter } from "@/middleware/rateLimiter.js";
import { getSubjects as getAdminSubjects } from "../subjects/get.js";

const router = Router();

// ============================================================================
// Admin Subjects Routes
// ============================================================================
router.get(
    "",
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getAdminSubjects as any
);

export default router;

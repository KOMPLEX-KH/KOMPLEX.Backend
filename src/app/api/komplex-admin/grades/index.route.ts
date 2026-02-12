import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import { adminGetSmallContentRateLimiter } from "@/middleware/rateLimiter.js";
import { getGrades as getAdminGrades } from "../grades/get.js";

const router = Router();

// ============================================================================
// Admin Grades Routes
// ============================================================================
router.get(
    "",
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getAdminGrades as any
);

export default router;

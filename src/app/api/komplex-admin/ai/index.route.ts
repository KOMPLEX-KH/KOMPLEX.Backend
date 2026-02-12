import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import { adminGetBigContentRateLimiter } from "@/middleware/rateLimiter.js";
import { getAiDashboard as getAdminAiDashboard } from "../ai/dashboard/get.js";
import { getGeneralAiDashboard as getAdminGeneralAiDashboard } from "../ai/general/dashboard/get.js";
import { getGeneralAiResponses as getAdminGeneralAiResponses } from "../ai/general/get.js";
import { getGeneralAiResponseById as getAdminGeneralAiResponseById } from "../ai/general/responses/[id]/get.js";
import { getTopicAiDashboard as getAdminTopicAiDashboard } from "../ai/topics/dashboard/get.js";
import { getTopicAiResponses as getAdminTopicAiResponses } from "../ai/topics/get.js";
import { getTopicAiResponseById as getAdminTopicAiResponseById } from "../ai/topics/responses/[id]/get.js";

const router = Router();

// ============================================================================
// Admin AI Routes
// ============================================================================
router.get("/dashboard", verifyFirebaseTokenAdmin as any, adminGetBigContentRateLimiter, getAdminAiDashboard as any);
router.get(
    "/general/dashboard",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAdminGeneralAiDashboard as any
);
router.get(
    "/general",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAdminGeneralAiResponses as any
);
router.get(
    "/general/responses/:id",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAdminGeneralAiResponseById as any
);
router.get(
    "/topics/dashboard",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAdminTopicAiDashboard as any
);
router.get(
    "/topics",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAdminTopicAiResponses as any
);
router.get(
    "/topics/responses/:id",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAdminTopicAiResponseById as any
);

export default router;

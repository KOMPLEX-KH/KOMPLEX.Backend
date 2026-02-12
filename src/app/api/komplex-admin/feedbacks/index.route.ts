import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import {
    adminGetSmallContentRateLimiter,
    adminSmallUpdateRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getFeedbacks } from "../feedbacks/get.js";
import { updateFeedbackStatus } from "../feedbacks/[id]/patch.js";

const router = Router();

// ============================================================================
// Admin Feedbacks Routes
// ============================================================================
router.get(
    "",
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getFeedbacks as any
);
router.patch(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateFeedbackStatus as any
);

export default router;

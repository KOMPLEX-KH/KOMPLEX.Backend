import Router from "express";
import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import { getSmallContentRateLimiter } from "@/middleware/rateLimiter.js";
import { getCurriculums } from "../../feed/curriculums/get.js";
import { getCurriculumTopic } from "../../feed/curriculums/[id]/get.js";

const router = Router();

// ============================================================================
// Feed Curriculums Routes
// ============================================================================
router.get("", verifyFirebaseTokenOptional as any, getSmallContentRateLimiter, getCurriculums as any);
router.get("/:id", verifyFirebaseTokenOptional as any, getSmallContentRateLimiter, getCurriculumTopic as any);

export default router;

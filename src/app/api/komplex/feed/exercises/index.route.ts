import Router from "express";
import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import { getSmallContentRateLimiter } from "@/middleware/rateLimiter.js";
import { getExercises } from "../../feed/exercises/get.js";
import { getExerciseById } from "../../feed/exercises/[id]/get.js";

const router = Router();

// ============================================================================
// Feed Exercises Routes
// ============================================================================
router.get("", verifyFirebaseTokenOptional as any, getSmallContentRateLimiter, getExercises as any);
router.get("/:id", verifyFirebaseTokenOptional as any, getSmallContentRateLimiter, getExerciseById as any);

export default router;

import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import {
    adminGetSmallContentRateLimiter,
    adminSmallPostRateLimiter,
    adminSmallUpdateRateLimiter,
    adminSmallDeleteRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getExercises as getAdminExercises } from "../exercises/get.js";
import { createExercise } from "../exercises/post.js";
import { getExercise as getAdminExercise } from "../exercises/[id]/get.js";
import { updateExercise } from "../exercises/[id]/put.js";
import { deleteExercise } from "../exercises/[id]/delete.js";
import { getExerciseDashboard } from "../exercises/dashboard/get.js";

const router = Router();

// ============================================================================
// Admin Exercises Routes
// ============================================================================
router.get(
    "",
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getAdminExercises as any
);
router.post("", verifyFirebaseTokenAdmin as any, adminSmallPostRateLimiter, createExercise as any);
router.get(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getAdminExercise as any
);
router.put(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateExercise as any
);
router.delete(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    deleteExercise as any
);
router.get(
    "/dashboard",
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getExerciseDashboard as any
);

export default router;

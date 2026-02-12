import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import {
    adminSmallPostRateLimiter,
    adminSmallUpdateRateLimiter,
    adminSmallDeleteRateLimiter,
} from "@/middleware/rateLimiter.js";
import { postNews } from "../news/post.js";
import { updateNews } from "../news/[id]/put.js";
import { deleteNews } from "../news/[id]/delete.js";

const router = Router();

// ============================================================================
// Admin News Routes
// ============================================================================
router.post("", verifyFirebaseTokenAdmin as any, adminSmallPostRateLimiter, postNews as any);
router.put(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateNews as any
);
router.delete(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    deleteNews as any
);

export default router;

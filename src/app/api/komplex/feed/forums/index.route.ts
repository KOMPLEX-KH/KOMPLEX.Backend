import Router from "express";
import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import { getBigContentRateLimiter } from "@/middleware/rateLimiter.js";
import { getAllForums as getAllFeedForums } from "../../feed/forums/get.js";
import { getForumById } from "../../feed/forums/[id]/get.js";
import { getForumComments } from "../../feed/forums/[id]/comments/get.js";
import { getForumReplies } from "../../feed/forums/[id]/comments/[id]/replies/get.js";

const router = Router();

// ============================================================================
// Feed Forums Routes
// ============================================================================
router.get("", verifyFirebaseTokenOptional as any, getBigContentRateLimiter, getAllFeedForums as any);
router.get("/:id", verifyFirebaseTokenOptional as any, getBigContentRateLimiter, getForumById as any);
router.get("/:id/comments", getForumComments as any);
router.get("/:id/comments/:id/replies", getForumReplies as any);

export default router;

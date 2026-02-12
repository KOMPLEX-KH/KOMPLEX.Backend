import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import {
    adminBigPostRateLimiter,
    adminBigUpdateRateLimiter,
    adminSmallPostRateLimiter,
    adminSmallDeleteRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getAllCommentsForAForum as getAllAdminCommentsForAForum } from "../forum_comments/[id]/get.js";
import { postForumComment as postAdminForumComment } from "../forum_comments/[id]/post.js";
import { updateForumComment as updateAdminForumComment } from "../forum_comments/[id]/patch.js";

const router = Router();

// ============================================================================
// Admin Forum Comments Routes
// ============================================================================
router.get("/:id", verifyFirebaseTokenAdmin as any, getAllAdminCommentsForAForum as any);
router.post("/:id", verifyFirebaseTokenAdmin as any, adminBigPostRateLimiter, postAdminForumComment as any);
router.patch("/:id", verifyFirebaseTokenAdmin as any, adminBigUpdateRateLimiter, updateAdminForumComment as any);

export default router;

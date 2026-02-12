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
import { likeForumComment as likeAdminForumComment } from "../forum_comments/[id]/like/post.js";
import { unlikeForumComment as unlikeAdminForumComment } from "../forum_comments/[id]/unlike/delete.js";

const router = Router();

// ============================================================================
// Admin Forum Comments Routes
// ============================================================================
router.get("/:id", verifyFirebaseTokenAdmin as any, getAllAdminCommentsForAForum as any);
router.post("/:id", verifyFirebaseTokenAdmin as any, adminBigPostRateLimiter, postAdminForumComment as any);
router.patch("/:id", verifyFirebaseTokenAdmin as any, adminBigUpdateRateLimiter, updateAdminForumComment as any);
router.post("/:id/like", verifyFirebaseTokenAdmin as any, adminSmallPostRateLimiter, likeAdminForumComment as any);
router.delete(
    "/:id/unlike",
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    unlikeAdminForumComment as any
);

export default router;

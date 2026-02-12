import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import {
    adminBigPostRateLimiter,
    adminBigUpdateRateLimiter,
    adminSmallPostRateLimiter,
    adminSmallDeleteRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getAllRepliesForAComment as getAllAdminRepliesForAComment } from "../forum_replies/[id]/get.js";
import { postForumReply as postAdminForumReply } from "../forum_replies/[id]/post.js";
import { updateForumReply as updateAdminForumReply } from "../forum_replies/[id]/patch.js";
import { likeForumReply as likeAdminForumReply } from "../forum_replies/[id]/like/post.js";
import { unlikeForumReply as unlikeAdminForumReply } from "../forum_replies/[id]/unlike/delete.js";

const router = Router();

// ============================================================================
// Admin Forum Replies Routes
// ============================================================================
router.get("/:id", verifyFirebaseTokenAdmin as any, getAllAdminRepliesForAComment as any);
router.post("/:id", verifyFirebaseTokenAdmin as any, adminBigPostRateLimiter, postAdminForumReply as any);
router.patch("/:id", verifyFirebaseTokenAdmin as any, adminBigUpdateRateLimiter, updateAdminForumReply as any);
router.post("/:id/like", verifyFirebaseTokenAdmin as any, adminSmallPostRateLimiter, likeAdminForumReply as any);
router.delete(
    "/:id/unlike",
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    unlikeAdminForumReply as any
);

export default router;

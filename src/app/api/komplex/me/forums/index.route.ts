import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import {
    getBigContentRateLimiter,
    postBigRateLimiter,
    updateBigRateLimiter,
    deleteBigRateLimiter,
    updateSmallRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getAllForums as getAllMyForums } from "../../me/forums/get.js";
import { postForum } from "../../me/forums/post.js";
import { updateForum } from "../../me/forums/[id]/put.js";
import { deleteForum } from "../../me/forums/[id]/delete.js";
import { likeForum } from "../../me/forums/[id]/like/patch.js";
import { unlikeForum } from "../../me/forums/[id]/unlike/patch.js";
import { postForumComment } from "../../me/forums/[id]/comments/post.js";
import { updateForumComment } from "../../me/forums/[id]/comments/[id]/put.js";
import { deleteForumComment } from "../../me/forums/[id]/comments/[id]/delete.js";
import { likeForumComment } from "../../me/forums/[id]/comments/[id]/like/patch.js";
import { unlikeForumComment } from "../../me/forums/[id]/comments/[id]/unlike/patch.js";
import { postForumReply } from "../../me/forums/[id]/comments/[id]/replies/post.js";
import { updateForumReply } from "../../me/forums/[id]/comments/[id]/replies/[id]/put.js";
import { deleteForumReply } from "../../me/forums/[id]/comments/[id]/replies/[id]/delete.js";
import { likeForumReply } from "../../me/forums/[id]/comments/[id]/replies/[id]/like/patch.js";
import { unlikeForumReply } from "../../me/forums/[id]/comments/[id]/replies/[id]/unlike/patch.js";

const router = Router();

// ============================================================================
// Me Forums Routes
// ============================================================================
router.get("", verifyFirebaseToken as any, getBigContentRateLimiter, getAllMyForums as any);
router.post("", verifyFirebaseToken as any, postBigRateLimiter, postForum as any);
router.put("/:id", verifyFirebaseToken as any, updateBigRateLimiter, updateForum as any);
router.delete("/:id", verifyFirebaseToken as any, deleteBigRateLimiter, deleteForum as any);
router.patch("/:id/like", verifyFirebaseToken as any, updateSmallRateLimiter, likeForum as any);
router.patch("/:id/unlike", verifyFirebaseToken as any, updateSmallRateLimiter, unlikeForum as any);
router.post(
    "/:id/comments",
    verifyFirebaseToken as any,
    postBigRateLimiter,
    postForumComment as any
);
router.put(
    "/:id/comments/:id",
    verifyFirebaseToken as any,
    updateBigRateLimiter,
    updateForumComment as any
);
router.delete(
    "/:id/comments/:id",
    verifyFirebaseToken as any,
    deleteBigRateLimiter,
    deleteForumComment as any
);
router.patch(
    "/:id/comments/:id/like",
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    likeForumComment as any
);
router.patch(
    "/:id/comments/:id/unlike",
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    unlikeForumComment as any
);
router.post(
    "/:id/comments/:id/replies",
    verifyFirebaseToken as any,
    postBigRateLimiter,
    postForumReply as any
);
router.put(
    "/:id/comments/:id/replies/:id",
    verifyFirebaseToken as any,
    updateBigRateLimiter,
    updateForumReply as any
);
router.delete(
    "/:id/comments/:id/replies/:id",
    verifyFirebaseToken as any,
    deleteBigRateLimiter,
    deleteForumReply as any
);
router.patch(
    "/:id/comments/:id/replies/:id/like",
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    likeForumReply as any
);
router.patch(
    "/:id/comments/:id/replies/:id/unlike",
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    unlikeForumReply as any
);

export default router;

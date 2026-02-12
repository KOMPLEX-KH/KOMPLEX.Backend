import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import {
    getVideoRateLimiter,
    postVideoRateLimiter,
    updateVideoRateLimiter,
    deleteVideoRateLimiter,
    updateSmallRateLimiter,
    updateBigRateLimiter,
    postBigRateLimiter,
    deleteBigRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getAllMyVideos } from "../../me/videos/get.js";
import { postVideo } from "../../me/videos/post.js";
import { updateVideo } from "../../me/videos/[id]/put.js";
import { deleteVideo } from "../../me/videos/[id]/delete.js";
import { likeVideo } from "../../me/videos/[id]/like/patch.js";
import { unlikeVideo } from "../../me/videos/[id]/unlike/patch.js";
import { postVideoComment } from "../../me/videos/[id]/comments/post.js";
import { updateVideoComment } from "../../me/videos/[id]/comments/[id]/put.js";
import { deleteVideoComment } from "../../me/videos/[id]/comments/[id]/delete.js";
import { likeVideoComment } from "../../me/videos/[id]/comments/[id]/like/patch.js";
import { unlikeVideoComment } from "../../me/videos/[id]/comments/[id]/unlike/patch.js";
import { postVideoReply } from "../../me/videos/[id]/comments/[id]/replies/post.js";
import { updateVideoReply } from "../../me/videos/[id]/comments/[id]/replies/[id]/put.js";
import { deleteVideoReply } from "../../me/videos/[id]/comments/[id]/replies/[id]/delete.js";
import { likeVideoReply } from "../../me/videos/[id]/comments/[id]/replies/[id]/like/patch.js";
import { unlikeVideoReply } from "../../me/videos/[id]/comments/[id]/replies/[id]/unlike/patch.js";

const router = Router();

// ============================================================================
// Me Videos Routes
// ============================================================================
router.get("", verifyFirebaseToken as any, getVideoRateLimiter, getAllMyVideos as any);
router.post("", verifyFirebaseToken as any, postVideoRateLimiter, postVideo as any);
router.put("/:id", verifyFirebaseToken as any, updateVideoRateLimiter, updateVideo as any);
router.delete("/:id", verifyFirebaseToken as any, deleteVideoRateLimiter, deleteVideo as any);
router.patch("/:id/like", verifyFirebaseToken as any, updateSmallRateLimiter, likeVideo as any);
router.patch("/:id/unlike", verifyFirebaseToken as any, updateSmallRateLimiter, unlikeVideo as any);
router.post(
    "/:id/comments",
    verifyFirebaseToken as any,
    postBigRateLimiter,
    postVideoComment as any
);
router.put(
    "/:id/comments/:id",
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    updateVideoComment as any
);
router.delete(
    "/:id/comments/:id",
    verifyFirebaseToken as any,
    deleteBigRateLimiter,
    deleteVideoComment as any
);
router.patch(
    "/:id/comments/:id/like",
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    likeVideoComment as any
);
router.patch(
    "/:id/comments/:id/unlike",
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    unlikeVideoComment as any
);
router.post(
    "/:id/comments/:id/replies",
    verifyFirebaseToken as any,
    postBigRateLimiter,
    postVideoReply as any
);
router.put(
    "/:id/comments/:id/replies/:id",
    verifyFirebaseToken as any,
    updateBigRateLimiter,
    updateVideoReply as any
);
router.delete(
    "/:id/comments/:id/replies/:id",
    verifyFirebaseToken as any,
    deleteBigRateLimiter,
    deleteVideoReply as any
);
router.patch(
    "/:id/comments/:id/replies/:id/like",
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    likeVideoReply as any
);
router.patch(
    "/:id/comments/:id/replies/:id/unlike",
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    unlikeVideoReply as any
);

export default router;

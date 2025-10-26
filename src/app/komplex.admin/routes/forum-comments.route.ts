import { Router } from "express";
import {
  deleteForumComment,
  getAllCommentsForAForum,
  likeForumComment,
  postForumComment,
  unlikeForumComment,
  updateForumComment,
} from "../controllers/forum-comments.controller.js";
import { uploadImages } from "../../../middleware/upload.js";
import { adminBigPostRateLimiter, adminBigUpdateRateLimiter, adminSmallDeleteRateLimiter, adminSmallPostRateLimiter } from "@/middleware/redisLimiter.js";
const router = Router();

// Add your route handlers here
router.get("/:id", getAllCommentsForAForum as any);
// <<<<<<< HEAD
// router.post("/:id", upload.any(), postForumComment);
// router.patch("/:id/like", likeForumComment);
// router.patch("/:id/unlike", unlikeForumComment);
// router.patch("/:id", upload.any(), updateForumComment);
// =======
router.post("/:id", uploadImages.array("images", 4), adminBigPostRateLimiter, postForumComment as any);
router.post("/:id/like", adminSmallPostRateLimiter, adminSmallPostRateLimiter, likeForumComment as any);
router.delete("/:id/unlike", adminSmallDeleteRateLimiter, unlikeForumComment as any);
router.patch("/:id", uploadImages.array("images", 4), adminBigUpdateRateLimiter, updateForumComment as any);
// >>>>>>> 141698d11d0c513180ff94ce485f4ca263d16a78
// router.delete("/:id", deleteForumComment);

export default router;

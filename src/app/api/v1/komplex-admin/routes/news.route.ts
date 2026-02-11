import { Router } from "express";
import { uploadImages } from "../../../../../middleware/upload.js";
import {
  postNewsController,
  updateNewsController,
  deleteNewsController,
} from "../controllers/news.controller.js";
import {
  adminGetSmallContentRateLimiter,
  adminSmallDeleteRateLimiter,
  adminSmallPostRateLimiter,
  adminSmallUpdateRateLimiter,
} from "@/middleware/redisLimiter.js";

const router = Router();

// Add your route handlers here
router.post(
  "/",
  adminSmallPostRateLimiter,
  uploadImages.array("images", 4),
  postNewsController as any
);
router.put(
  "/:id",
  adminSmallUpdateRateLimiter,
  uploadImages.array("images", 4),
  updateNewsController as any
);

router.delete("/:id", adminSmallDeleteRateLimiter, deleteNewsController as any);

export default router;

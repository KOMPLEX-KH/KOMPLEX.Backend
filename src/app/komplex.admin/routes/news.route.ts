import { Router } from "express";
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
router.post("/", adminSmallPostRateLimiter, postNewsController as any);
router.put("/:id", adminSmallUpdateRateLimiter, updateNewsController as any);
router.delete("/:id", adminSmallDeleteRateLimiter, deleteNewsController as any);

export default router;

import {  verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import { Router } from "express";
import {
  getAllNewsController,
  getNewsByIdController,
  // TODO: Future features
  // getBlogLikes, // GET /blogs/:id/likes - who liked this blog
  // getBlogComments, // GET /blogs/:id/comments - comments on this blog
} from "@/app/api/v2/komplex/controllers/feed/news.controller.js";
import { getSmallContentRateLimiter } from "@/middleware/redisLimiter.js";

const router = Router();

router.get(
  "/",
  verifyFirebaseTokenOptional as any,
  getSmallContentRateLimiter,
  getAllNewsController as any
);

router.get(
  "/:id",
  verifyFirebaseTokenOptional as any,
  getSmallContentRateLimiter,
  getNewsByIdController as any
);

export default router;

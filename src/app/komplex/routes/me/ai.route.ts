import { verifyFirebaseToken } from "@/middleware/auth.js";
import { Router } from "express";
import {
  callAiAndWriteToHistory,
  getMyAiHistoryController,
  getAiTopicResponseController,
  rateAiResponseController,
  rateAiTopicResponseController,
} from "../../controllers/me/ai.controller.js";
import { aiRateLimiter } from "@/middleware/redisLimiter.js";
import { getAiTopicHistoryController } from "../../controllers/me/ai.controller.js";
const router = Router();

// general ai
router.post(
  "/",
  verifyFirebaseToken as any,
  aiRateLimiter,
  callAiAndWriteToHistory as any
);
router.get(
  "/",
  aiRateLimiter,
  verifyFirebaseToken as any,
  getMyAiHistoryController as any
);

// ai trained per topic

router.post(
  "/topics/:id",
  aiRateLimiter,
  verifyFirebaseToken as any,
  getAiTopicResponseController as any
);
router.get(
  "/topics/:id",
  aiRateLimiter,
  verifyFirebaseToken as any,
  getAiTopicHistoryController as any
);

// ai rating

// rating of a general ai response
router.post(
  "/:id/rating",
  aiRateLimiter,
  verifyFirebaseToken as any,
  rateAiResponseController as any
);

// rating of a response on a topic
router.post(
  "/topics/:id/rating",
  aiRateLimiter,
  verifyFirebaseToken as any,
  rateAiTopicResponseController as any
);

export default router;

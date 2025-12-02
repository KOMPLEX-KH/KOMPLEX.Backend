import { verifyFirebaseToken } from "@/middleware/auth.js";
import { Router } from "express";
import { aiRateLimiter } from "@/middleware/redisLimiter.js";
import {
  callAiGeneralFirstTime,
  callAiTopic,
  getAiGeneralHistoryBasedOnTab,
  getAiGeneralHistoryBasedOnTopic,
  getAllAiGeneralTabNames,
  callAiGeneralAndWriteToHistory,
  getAllAiTopicNames,
  getAiTopicHistoryController,
} from "../../controllers/me/ai.controller.js";
const router = Router();

// ai general
router.get(
  "/general/tabs",
  verifyFirebaseToken as any,
  aiRateLimiter,
  getAllAiGeneralTabNames as any
);
router.get(
  "/general/tabs/:tabId",
  verifyFirebaseToken as any,
  aiRateLimiter,
  getAiGeneralHistoryBasedOnTab as any
);
router.post(
  "/general/tabs/:tabId",
  verifyFirebaseToken as any,
  aiRateLimiter,
  callAiGeneralAndWriteToHistory as any
);
router.post(
  "/general/tabs",
  verifyFirebaseToken as any,
  aiRateLimiter,
  callAiGeneralFirstTime as any
);

// ai topic
router.get(
  "/topics",
  verifyFirebaseToken as any,
  aiRateLimiter,
  getAllAiTopicNames as any
);
router.get(
  "/topics/:topicId",
  verifyFirebaseToken as any,
  aiRateLimiter,
  getAiTopicHistoryController as any
);
router.post(
  "/topics/:topicId",
  verifyFirebaseToken as any,
  aiRateLimiter,
  callAiTopic as any
);

export default router;

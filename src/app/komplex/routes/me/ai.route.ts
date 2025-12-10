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
  rateAiTopicResponseController,
  rateAiGeneralResponseController,
  editAiGeneralTabController,
  deleteAiGeneralTabController,
  deleteAiTopicTabController,
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
router.delete(
  "/general/tabs/:id",
  verifyFirebaseToken as any,
  aiRateLimiter,
  deleteAiGeneralTabController as any
);
router.put(
  "/general/tabs/:id",
  verifyFirebaseToken as any,
  aiRateLimiter,
  editAiGeneralTabController as any
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
router.delete(
  "/topics/:id",
  verifyFirebaseToken as any,
  aiRateLimiter,
  deleteAiTopicTabController as any
);

// rating
router.post(
  "/topics/rating/:id",
  verifyFirebaseToken as any,
  aiRateLimiter,
  rateAiTopicResponseController as any
);

router.post(
  "/general/rating/:id",
  verifyFirebaseToken as any,
  aiRateLimiter,
  rateAiGeneralResponseController as any
);

export default router;

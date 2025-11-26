import { verifyFirebaseToken } from "@/middleware/auth.js";
import { Router } from "express";
import { aiRateLimiter } from "@/middleware/redisLimiter.js";
import {
	callAiFirstTime,
	callAiGeneral,
	callAiTopic,
	getAiHistoryBasedOnTab,
	getAiHistoryBasedOnTopic,
	getAllAiTabNames,
} from "../../controllers/me/ai.controller.js";
const router = Router();

router.get("/tab", aiRateLimiter, getAllAiTabNames as any);
router.get("/:tabId/tab", aiRateLimiter, getAiHistoryBasedOnTab as any);
router.get("/:topicId/topic", aiRateLimiter, getAiHistoryBasedOnTopic as any);
router.post("/:tabId/tab", aiRateLimiter, callAiGeneral as any);
router.post("/tab", aiRateLimiter, callAiFirstTime as any);
router.post("/:topicId/topic", aiRateLimiter, callAiTopic as any);

export default router;

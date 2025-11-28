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

router.get("/tab", verifyFirebaseToken as any, aiRateLimiter, getAllAiTabNames as any);
router.get("/tab/:tabId", verifyFirebaseToken as any, aiRateLimiter, getAiHistoryBasedOnTab as any);
router.get("/topic/:topicId", verifyFirebaseToken as any, aiRateLimiter, getAiHistoryBasedOnTopic as any);
router.post("/tab/:tabId", verifyFirebaseToken as any, aiRateLimiter, callAiGeneral as any);
router.post("/tab", verifyFirebaseToken as any, aiRateLimiter, callAiFirstTime as any);
router.post("/topic/:topicId", verifyFirebaseToken as any, aiRateLimiter, callAiTopic as any);

export default router;

import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import { aiRateLimiter } from "@/middleware/rateLimiter.js";
import { getAllAiGeneralTabs } from "../../me/ai/general/tabs/get.js";
import { createAiGeneralTab } from "../../me/ai/general/tabs/post.js";
import { getAiGeneralTabHistory } from "../../me/ai/general/tabs/[id]/get.js";
import { postAiGeneral } from "../../me/ai/general/tabs/[id]/post.js";
import { updateAiGeneralTab } from "../../me/ai/general/tabs/[id]/put.js";
import { deleteAiGeneralTab } from "../../me/ai/general/tabs/[id]/delete.js";
import { rateAiGeneralResponse } from "../../me/ai/general/rating/[id]/post.js";
import { getAllAiTopics } from "../../me/ai/topics/get.js";
import { getAiTopicHistory } from "../../me/ai/topics/[id]/get.js";
import { callAiTopic } from "../../me/ai/topics/[id]/post.js";
import { deleteAiTopic } from "../../me/ai/topics/[id]/delete.js";
import { rateAiTopicResponse } from "../../me/ai/topics/rating/[id]/post.js";

const router = Router();

// ============================================================================
// Me AI Routes
// ============================================================================
router.get("/general/tabs", verifyFirebaseToken as any, aiRateLimiter, getAllAiGeneralTabs as any);
router.post("/general/tabs", verifyFirebaseToken as any, aiRateLimiter, createAiGeneralTab as any);
router.get(
    "/general/tabs/:id",
    verifyFirebaseToken as any,
    aiRateLimiter,
    getAiGeneralTabHistory as any
);
router.post("/general/tabs/:id", verifyFirebaseToken as any, aiRateLimiter, postAiGeneral as any);
router.put(
    "/general/tabs/:id",
    verifyFirebaseToken as any,
    aiRateLimiter,
    updateAiGeneralTab as any
);
router.delete(
    "/general/tabs/:id",
    verifyFirebaseToken as any,
    aiRateLimiter,
    deleteAiGeneralTab as any
);
router.post(
    "/general/rating/:id",
    verifyFirebaseToken as any,
    aiRateLimiter,
    rateAiGeneralResponse as any
);
router.get("/topics", verifyFirebaseToken as any, aiRateLimiter, getAllAiTopics as any);
router.get("/topics/:id", verifyFirebaseToken as any, aiRateLimiter, getAiTopicHistory as any);
router.post("/topics/:id", verifyFirebaseToken as any, aiRateLimiter, callAiTopic as any);
router.delete("/topics/:id", verifyFirebaseToken as any, aiRateLimiter, deleteAiTopic as any);
router.post("/topics/rating/:id", verifyFirebaseToken as any, aiRateLimiter, rateAiTopicResponse as any);

export default router;

import { Router } from "express";
import { newsSearchController } from "@/app/komplex/controllers/search/news.controller.js";
import { searchRateLimiter } from "@/middleware/redisLimiter.js";
import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";

const router = Router();
router.get("/", searchRateLimiter, verifyFirebaseTokenOptional as any, newsSearchController as any);

export default router;

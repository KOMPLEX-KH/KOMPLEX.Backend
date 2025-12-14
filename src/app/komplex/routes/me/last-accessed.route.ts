import { Router } from "express";
import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import { getLastAccessed } from "../../controllers/me/last-accesed.controller.js";
import { getSmallContentRateLimiter } from "@/middleware/redisLimiter.js";

const router = Router();

router.get(
  "/",
  verifyFirebaseTokenOptional as any,
  getSmallContentRateLimiter,
  getLastAccessed as any
);

export default router;

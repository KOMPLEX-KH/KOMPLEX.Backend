import { Router } from "express";
import { updateLesson } from "../controllers/lessons.controller.js";
import { adminSmallUpdateRateLimiter } from "@/middleware/redisLimiter.js";

const router = Router();

router.put("/:id", adminSmallUpdateRateLimiter, updateLesson as any);

export default router;
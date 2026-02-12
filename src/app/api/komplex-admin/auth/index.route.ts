import Router from "express";
import { adminLoginRateLimiter } from "@/middleware/rateLimiter.js";
import { login } from "../auth/login/post.js";

const router = Router();

// ============================================================================
// Admin Authentication Routes
// ============================================================================
router.post("/login", adminLoginRateLimiter, login as any);

export default router;

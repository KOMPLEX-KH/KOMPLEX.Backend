import Router from "express";
import { userLoginRateLimiter, userSignupRateLimiter } from "@/middleware/rateLimiter.js";
import { postSignup } from "../auth/signup/post.js";
import { postSocialLogIn } from "../auth/social-login/post.js";

const router = Router();

// ============================================================================
// Authentication Routes
// ============================================================================
router.post("/signup", userSignupRateLimiter, postSignup as any);
router.post("/social-login", userLoginRateLimiter, postSocialLogIn as any);

export default router;

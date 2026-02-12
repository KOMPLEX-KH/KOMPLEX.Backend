import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import { followLimiter } from "@/middleware/rateLimiter.js";
import { getFollowers } from "../../me/follow/followers/get.js";
import { getFollowing } from "../../me/follow/following/get.js";
import { followUser } from "../../me/follow/follow/[id]/post.js";
import { unfollowUser } from "../../me/follow/unfollow/[id]/post.js";

const router = Router();

// ============================================================================
// Me Follow Routes
// ============================================================================
router.get("/followers", verifyFirebaseToken as any, followLimiter, getFollowers as any);
router.get("/following", verifyFirebaseToken as any, followLimiter, getFollowing as any);
router.post("/follow/:id", verifyFirebaseToken as any, followLimiter, followUser as any);
router.post("/unfollow/:id", verifyFirebaseToken as any, followLimiter, unfollowUser as any);

export default router;

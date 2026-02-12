import Router from "express";
import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import { searchRateLimiter } from "@/middleware/rateLimiter.js";
import { searchVideos } from "../search/videos/get.js";
import { searchForums } from "../search/forums/get.js";
import { searchNews } from "../search/news/get.js";

const router = Router();

// ============================================================================
// Search Routes
// ============================================================================
router.get(
    "/videos",
    verifyFirebaseTokenOptional as any,
    searchRateLimiter,
    searchVideos as any
);
router.get(
    "/forums",
    verifyFirebaseTokenOptional as any,
    searchRateLimiter,
    searchForums as any
);
router.get(
    "/news",
    verifyFirebaseTokenOptional as any,
    searchRateLimiter,
    searchNews as any
);

export default router;

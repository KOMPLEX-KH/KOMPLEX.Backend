import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import { getMe } from "../../me/get.js";
import { getMeProfile } from "../../me/profile/get.js";

const router = Router();

// ============================================================================
// Me Profile Routes
// ============================================================================
router.get("", verifyFirebaseToken as any, getMe as any);
router.get("/profile", verifyFirebaseToken as any, getMeProfile as any);

export default router;

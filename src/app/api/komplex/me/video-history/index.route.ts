import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import { getMyVideoHistory } from "../../me/video-history/get.js";

const router = Router();

// ============================================================================
// Me Video History Routes
// ============================================================================
router.get("", verifyFirebaseToken as any, getMyVideoHistory as any);

export default router;

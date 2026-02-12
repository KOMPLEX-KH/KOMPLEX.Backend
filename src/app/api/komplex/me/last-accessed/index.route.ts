import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import { getLastAccessed } from "../../me/last-accessed/get.js";

const router = Router();

// ============================================================================
// Me Last Accessed Routes
// ============================================================================
router.get("", verifyFirebaseToken as any, getLastAccessed as any);

export default router;

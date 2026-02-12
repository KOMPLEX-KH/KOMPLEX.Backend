import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import { getMeDashboard } from "../../me/dashboard/get.js";

const router = Router();

// ============================================================================
// Me Dashboard Routes
// ============================================================================
router.get("", verifyFirebaseToken as any, getMeDashboard as any);

export default router;

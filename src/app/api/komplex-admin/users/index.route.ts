import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import { adminGetBigContentRateLimiter } from "@/middleware/rateLimiter.js";
import { getAllUsers } from "../users/get.js";
import { getAllAdmins } from "../users/admins/get.js";
import { createAdmin } from "../users/admins/post.js";
import { updateAdmin } from "../users/admins/[id]/put.js";
import { deleteAdmin } from "../users/admins/[id]/delete.js";

const router = Router();

// ============================================================================
// Admin Users Routes
// ============================================================================
router.get("", verifyFirebaseTokenAdmin as any, adminGetBigContentRateLimiter, getAllUsers as any);
router.get("/admins", verifyFirebaseTokenAdmin as any, adminGetBigContentRateLimiter, getAllAdmins as any);
router.post("/admins", verifyFirebaseTokenAdmin as any, createAdmin as any);
router.put("/admins/:id", verifyFirebaseTokenAdmin as any, updateAdmin as any);
router.delete("/admins/:id", verifyFirebaseTokenAdmin as any, deleteAdmin as any);

export default router;

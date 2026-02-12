import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import { uploadFile as uploadAdminFile } from "../upload/file/post.js";

const router = Router();

// ============================================================================
// Admin Upload Routes
// ============================================================================
router.post("/file", verifyFirebaseTokenAdmin as any, uploadAdminFile as any);

export default router;

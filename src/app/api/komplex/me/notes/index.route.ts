import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import {
    getSmallContentRateLimiter,
    getBigContentRateLimiter,
    postBigRateLimiter,
    deleteSmallRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getMyNotes } from "../../me/notes/get.js";
import { createMyNote } from "../../me/notes/post.js";
import { getMyNoteById } from "../../me/notes/[id]/get.js";
import { updateMyNote } from "../../me/notes/[id]/put.js";
import { deleteMyNote } from "../../me/notes/[id]/delete.js";

const router = Router();

// ============================================================================
// Me Notes Routes
// ============================================================================
router.get("", verifyFirebaseToken as any, getSmallContentRateLimiter, getMyNotes as any);
router.post("", verifyFirebaseToken as any, getBigContentRateLimiter, createMyNote as any);
router.get("/:id", verifyFirebaseToken as any, getSmallContentRateLimiter, getMyNoteById as any);
router.put("/:id", verifyFirebaseToken as any, postBigRateLimiter, updateMyNote as any);
router.delete("/:id", verifyFirebaseToken as any, deleteSmallRateLimiter, deleteMyNote as any);

export default router;

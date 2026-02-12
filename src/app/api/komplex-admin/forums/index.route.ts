import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import {
    adminGetBigContentRateLimiter,
    adminBigUpdateRateLimiter,
    adminBigDeleteRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getAllForums as getAllAdminForums } from "../forums/get.js";
import { getForumById as getAdminForumById } from "../forums/[id]/get.js";
import { updateForum as updateAdminForum } from "../forums/[id]/put.js";
import { deleteForum as deleteAdminForum } from "../forums/[id]/delete.js";

const router = Router();

// ============================================================================
// Admin Forums Routes
// ============================================================================
router.get(
    "",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAllAdminForums as any
);
router.get(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAdminForumById as any
);
router.put(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminBigUpdateRateLimiter,
    updateAdminForum as any
);
router.delete(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminBigDeleteRateLimiter,
    deleteAdminForum as any
);

export default router;

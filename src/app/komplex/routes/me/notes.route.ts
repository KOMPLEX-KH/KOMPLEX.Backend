import { Router } from "express";
import { getAllMyNotesController, getMyNoteByIdController, createMyNotesController, updateMyNoteController, DeleteMyNoteController } from "../../controllers/me/notes.controller.js";

import {
  deleteBigRateLimiter,
  postBigRateLimiter,
  updateBigRateLimiter,
  getBigContentRateLimiter,
  getSmallContentRateLimiter,
  deleteSmallRateLimiter
} from "@/middleware/redisLimiter.js";
import { verifyFirebaseToken } from "@/middleware/auth.js";

const router = Router();


router.get(
  "/",
  verifyFirebaseToken as any,
  getSmallContentRateLimiter,
  getAllMyNotesController as any
);

router.get(
  "/:id",
  verifyFirebaseToken as any,
  getSmallContentRateLimiter,
  getMyNoteByIdController as any
);

router.post(
  "/",
  verifyFirebaseToken as any,
  getBigContentRateLimiter,
  createMyNotesController as any
);


router.put(
  "/:id",
  verifyFirebaseToken as any,
  postBigRateLimiter,
  updateMyNoteController as any
);


router.delete(
  "/:id",
  verifyFirebaseToken as any,
  deleteSmallRateLimiter,
  DeleteMyNoteController as any
);

export default router;

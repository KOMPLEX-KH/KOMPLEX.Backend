import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import { Router } from "express";
import {
  getCurriculums,
  getTopic,
} from "../../controllers/feed/curriculums.controller.js";

const router = Router();

router.get("/", verifyFirebaseTokenOptional as any, getCurriculums as any);
router.get("/:id", verifyFirebaseTokenOptional as any, getTopic as any);

export default router;

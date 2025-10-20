import { Router } from "express";
import {
  getCurriculums,
  getTopic,
} from "../../controllers/feed/curriculums.controller.js";

const router = Router();

router.get("/", getCurriculums);
router.get("/:id", getTopic);

export default router;

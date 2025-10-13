import { Router } from "express";
import {
  getLessons,
  getTopic,
} from "../../controllers/feed/lessons.controller.js";

const router = Router();

router.get("/", getLessons);
router.get("/:id", getTopic);

export default router;

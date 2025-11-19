import { Router } from "express";
import {
  getGeneralAiResponsesController,
  getTopicAiResponsesController,
  getGeneralAiDashboardController,
  getTopicAiDashboardController,
} from "../controllers/ai.controller.js";

const router = Router();

router.get("/general", getGeneralAiResponsesController as any);
router.get("/topics", getTopicAiResponsesController as any);
router.get("/general/dashboard", getGeneralAiDashboardController as any);
router.get("/topics/dashboard", getTopicAiDashboardController as any);

export default router;

import { Router } from "express";
import {
  getGeneralAiResponsesController,
  getTopicAiResponsesController,
  getGeneralAiDashboardController,
  getTopicAiDashboardController,
  getAiDashboardController,
  getGeneralAiResponseByIdController,
  getTopicAiResponseByIdController,
} from "../controllers/ai.controller.js";

const router = Router();

// Combined dashboard
router.get("/dashboard", getAiDashboardController as any);

// General AI routes
router.get("/general/dashboard", getGeneralAiDashboardController as any);
router.get("/general", getGeneralAiResponsesController as any);
router.get("/general/responses/:id", getGeneralAiResponseByIdController as any);

// Topic AI routes
router.get("/topics/dashboard", getTopicAiDashboardController as any);
router.get("/topics", getTopicAiResponsesController as any);
router.get("/topics/responses/:id", getTopicAiResponseByIdController as any);

export default router;

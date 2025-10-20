import { Router } from "express";
import {
  updateTopicComponent,
  updateTopic,
  deleteTopic,
  updateGrade,
  updateSubject,
  updateLesson,
  deleteGrade,
  deleteSubject,
  deleteLesson,
  createGrade,
  createSubject,
  createTopic,
  createLesson,
} from "../controllers/curriculums.controller.js";
import {
  adminSmallDeleteRateLimiter,
  adminSmallUpdateRateLimiter,
} from "@/middleware/redisLimiter.js";

const router = Router();

/**
 * GRADE ROUTES
 */
router.post("/grades", createGrade as any);

router.patch("/grades/:id", adminSmallUpdateRateLimiter, updateGrade as any);
router.delete("/grades/:id", adminSmallDeleteRateLimiter, deleteGrade as any);

/**
 * SUBJECT ROUTES
 */
router.post("/subjects", createSubject as any);

router.patch(
  "/subjects/:id",
  adminSmallUpdateRateLimiter,
  updateSubject as any
);
router.delete(
  "/subjects/:id",
  adminSmallDeleteRateLimiter,
  deleteSubject as any
);

/**
 * LESSON ROUTES
 */
router.post("/lessons", createLesson as any);

router.patch("/lessons/:id", adminSmallUpdateRateLimiter, updateLesson as any);
router.delete("/lessons/:id", adminSmallDeleteRateLimiter, deleteLesson as any);

/**
 * TOPIC ROUTES
 */
router.post("/topics", createTopic as any);

router.put(
  "/topics/:id",
  adminSmallUpdateRateLimiter,
  updateTopicComponent as any
);
router.patch("/topics/:id", adminSmallUpdateRateLimiter, updateTopic as any);
router.delete("/topics/:id", adminSmallDeleteRateLimiter, deleteTopic as any);

export default router;

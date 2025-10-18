import { Router } from "express";
import {
  updateLessonTopicComponent,
  updateLessonTopic,
  deleteLessonTopic,
  updateLessonGrade,
  updateLessonSubject,
  updateLessonLesson,
  deleteLessonGrade,
  deleteLessonSubject,
  deleteLessonLesson,
  createLessonGrade,
  createLessonSubject,
  createLessonTopic,
  createLessonLesson,
} from "../controllers/lessons.controller.js";
import {
  adminSmallDeleteRateLimiter,
  adminSmallUpdateRateLimiter,
} from "@/middleware/redisLimiter.js";

const router = Router();

/**
 * GRADE ROUTES
 */
router.post("/grade", createLessonGrade as any);

router.patch(
  "/grade/:id",
  adminSmallUpdateRateLimiter,
  updateLessonGrade as any
);
router.delete(
  "/grade/:id",
  adminSmallDeleteRateLimiter,
  deleteLessonGrade as any
);

/**
 * SUBJECT ROUTES
 */
router.post("/subject", createLessonSubject as any);

router.patch(
  "/subject/:id",
  adminSmallUpdateRateLimiter,
  updateLessonSubject as any
);
router.delete(
  "/subject/:id",
  adminSmallDeleteRateLimiter,
  deleteLessonSubject as any
);

/**
 * LESSON ROUTES
 */
router.post("/lesson", createLessonLesson as any);

router.patch(
  "/lesson/:id",
  adminSmallUpdateRateLimiter,
  updateLessonLesson as any
);
router.delete(
  "/lesson/:id",
  adminSmallDeleteRateLimiter,
  deleteLessonLesson as any
);

/**
 * TOPIC ROUTES
 */
router.post("/topic", createLessonTopic as any);

router.put(
  "/topic-component/:id",
  adminSmallUpdateRateLimiter,
  updateLessonTopicComponent as any
);
router.patch(
  "/topic/:id",
  adminSmallUpdateRateLimiter,
  updateLessonTopic as any
);
router.delete(
  "/topic/:id",
  adminSmallDeleteRateLimiter,
  deleteLessonTopic as any
);

export default router;

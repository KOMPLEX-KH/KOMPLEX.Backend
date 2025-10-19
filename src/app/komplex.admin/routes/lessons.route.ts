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
router.post("/grades", createLessonGrade as any);

router.patch(
  "/grades/:id",
  adminSmallUpdateRateLimiter,
  updateLessonGrade as any
);
router.delete(
  "/grades/:id",
  adminSmallDeleteRateLimiter,
  deleteLessonGrade as any
);

/**
 * SUBJECT ROUTES
 */
router.post("/subjects", createLessonSubject as any);

router.patch(
  "/subjects/:id",
  adminSmallUpdateRateLimiter,
  updateLessonSubject as any
);
router.delete(
  "/subjects/:id",
  adminSmallDeleteRateLimiter,
  deleteLessonSubject as any
);

/**
 * LESSON ROUTES
 */
router.post("/lessons", createLessonLesson as any);

router.patch(
  "/lessons/:id",
  adminSmallUpdateRateLimiter,
  updateLessonLesson as any
);
router.delete(
  "/lessons/:id",
  adminSmallDeleteRateLimiter,
  deleteLessonLesson as any
);

/**
 * TOPIC ROUTES
 */
router.post("/topics", createLessonTopic as any);

router.put(
  "/topics/component/:id",
  adminSmallUpdateRateLimiter,
  updateLessonTopicComponent as any
);
router.patch(
  "/topics/:id",
  adminSmallUpdateRateLimiter,
  updateLessonTopic as any
);
router.delete(
  "/topics/:id",
  adminSmallDeleteRateLimiter,
  deleteLessonTopic as any
);

export default router;

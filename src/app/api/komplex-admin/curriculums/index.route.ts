import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import {
    adminSmallUpdateRateLimiter,
    adminSmallDeleteRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getCurriculumsDashboard as getAdminCurriculumsDashboard } from "../curriculums/dashboard/get.js";
import { createGrade as createAdminGrade } from "../curriculums/grades/post.js";
import { updateGrade as updateAdminGrade } from "../curriculums/grades/[id]/patch.js";
import { deleteGrade as deleteAdminGrade } from "../curriculums/grades/[id]/delete.js";
import { createSubject as createAdminSubject } from "../curriculums/subjects/post.js";
import { updateSubject as updateAdminSubject } from "../curriculums/subjects/[id]/patch.js";
import { deleteSubject as deleteAdminSubject } from "../curriculums/subjects/[id]/delete.js";
import { createLesson as createAdminLesson } from "../curriculums/lessons/post.js";
import { updateLesson as updateAdminLesson } from "../curriculums/lessons/[id]/patch.js";
import { deleteLesson as deleteAdminLesson } from "../curriculums/lessons/[id]/delete.js";
import { createTopic as createAdminTopic } from "../curriculums/topics/post.js";
import { updateTopicComponent as updateAdminTopicComponent } from "../curriculums/topics/[id]/put.js";
import { updateTopic as updateAdminTopic } from "../curriculums/topics/[id]/patch.js";
import { deleteTopic as deleteAdminTopic } from "../curriculums/topics/[id]/delete.js";

const router = Router();

// ============================================================================
// Admin Curriculums Routes
// ============================================================================
router.get("/dashboard", verifyFirebaseTokenAdmin as any, getAdminCurriculumsDashboard as any);
router.post("/grades", verifyFirebaseTokenAdmin as any, createAdminGrade as any);
router.patch(
    "/grades/:id",
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateAdminGrade as any
);
router.delete(
    "/grades/:id",
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    deleteAdminGrade as any
);
router.post("/subjects", verifyFirebaseTokenAdmin as any, createAdminSubject as any);
router.patch(
    "/subjects/:id",
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateAdminSubject as any
);
router.delete(
    "/subjects/:id",
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    deleteAdminSubject as any
);
router.post("/lessons", verifyFirebaseTokenAdmin as any, createAdminLesson as any);
router.patch(
    "/lessons/:id",
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateAdminLesson as any
);
router.delete(
    "/lessons/:id",
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    deleteAdminLesson as any
);
router.post("/topics", verifyFirebaseTokenAdmin as any, createAdminTopic as any);
router.put(
    "/topics/:id",
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateAdminTopicComponent as any
);
router.patch(
    "/topics/:id",
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateAdminTopic as any
);
router.delete(
    "/topics/:id",
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    deleteAdminTopic as any
);

export default router;

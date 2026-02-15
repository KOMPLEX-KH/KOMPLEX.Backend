import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import {
    adminSmallUpdateRateLimiter,
    adminSmallDeleteRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getCurriculumsDashboard as getAdminCurriculumsDashboard, CurriculumsDashboardResponseSchema } from "../curriculums/dashboard/get.js";
import { createGrade as createAdminGrade, CreateGradeBodySchema, CreateGradeResponseSchema } from "../curriculums/grades/post.js";
import { updateGrade as updateAdminGrade, UpdateGradeParamsSchema, UpdateGradeBodySchema, UpdateGradeResponseSchema } from "../curriculums/grades/[id]/patch.js";
import { deleteGrade as deleteAdminGrade, DeleteGradeResponseSchema } from "../curriculums/grades/[id]/delete.js";
import { createSubject as createAdminSubject, CreateSubjectBodySchema, CreateSubjectResponseSchema } from "../curriculums/subjects/post.js";
import { updateSubject as updateAdminSubject, UpdateSubjectParamsSchema, UpdateSubjectBodySchema, UpdateSubjectResponseSchema } from "../curriculums/subjects/[id]/patch.js";
import { deleteSubject as deleteAdminSubject, DeleteSubjectParamsSchema, DeleteSubjectResponseSchema } from "../curriculums/subjects/[id]/delete.js";
import { createLesson as createAdminLesson, CreateLessonBodySchema, CreateLessonResponseSchema } from "../curriculums/lessons/post.js";
import { updateLesson as updateAdminLesson, UpdateLessonParamsSchema, UpdateLessonBodySchema, UpdateLessonResponseSchema } from "../curriculums/lessons/[id]/patch.js";
import { deleteLesson as deleteAdminLesson, DeleteLessonParamsSchema, DeleteLessonResponseSchema } from "../curriculums/lessons/[id]/delete.js";
import { createTopic as createAdminTopic, CreateTopicBodySchema, CreateTopicResponseSchema } from "../curriculums/topics/post.js";
import { updateTopicComponent as updateAdminTopicComponent, UpdateTopicComponentParamsSchema, UpdateTopicComponentBodySchema, UpdateTopicComponentResponseSchema } from "../curriculums/topics/[id]/put.js";
import { updateTopic as updateAdminTopic, UpdateTopicParamsSchema, UpdateTopicBodySchema, UpdateTopicResponseSchema } from "../curriculums/topics/[id]/patch.js";
import { deleteTopic as deleteAdminTopic, DeleteTopicParamsSchema, DeleteTopicResponseSchema } from "../curriculums/topics/[id]/delete.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";

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

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.GET,
    path: "/komplex-admin/curriculums/dashboard",
    summary: "Get curriculums dashboard",
    tag: "Admin Curriculums",
    responses: {
        200: {
            description: "Curriculums dashboard retrieved successfully",
            schema: getResponseSuccessSchema(CurriculumsDashboardResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.POST,
    path: "/komplex-admin/curriculums/grades",
    summary: "Create a grade",
    tag: "Admin Curriculums",
    body: CreateGradeBodySchema,
    responses: {
        201: {
            description: "Grade created successfully",
            schema: getResponseSuccessSchema(CreateGradeResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.PATCH,
    path: "/komplex-admin/curriculums/grades/:id",
    summary: "Update a grade",
    tag: "Admin Curriculums",
    body: UpdateGradeBodySchema,
    responses: {
        200: {
            description: "Grade updated successfully",
            schema: getResponseSuccessSchema(UpdateGradeResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.DELETE,
    path: "/komplex-admin/curriculums/grades/:id",
    summary: "Delete a grade",
    tag: "Admin Curriculums",
    responses: {
        200: {
            description: "Grade deleted successfully",
            schema: getResponseSuccessSchema(DeleteGradeResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.POST,
    path: "/komplex-admin/curriculums/subjects",
    summary: "Create a subject",
    tag: "Admin Curriculums",
    body: CreateSubjectBodySchema,
    responses: {
        201: {
            description: "Subject created successfully",
            schema: getResponseSuccessSchema(CreateSubjectResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.PATCH,
    path: "/komplex-admin/curriculums/subjects/:id",
    summary: "Update a subject",
    tag: "Admin Curriculums",
    body: UpdateSubjectBodySchema,
    responses: {
        200: {
            description: "Subject updated successfully",
            schema: getResponseSuccessSchema(UpdateSubjectResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.DELETE,
    path: "/komplex-admin/curriculums/subjects/:id",
    summary: "Delete a subject",
    tag: "Admin Curriculums",
    responses: {
        200: {
            description: "Subject deleted successfully",
            schema: getResponseSuccessSchema(DeleteSubjectResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.POST,
    path: "/komplex-admin/curriculums/lessons",
    summary: "Create a lesson",
    tag: "Admin Curriculums",
    body: CreateLessonBodySchema,
    responses: {
        201: {
            description: "Lesson created successfully",
            schema: getResponseSuccessSchema(CreateLessonResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.PATCH,
    path: "/komplex-admin/curriculums/lessons/:id",
    summary: "Update a lesson",
    tag: "Admin Curriculums",
    body: UpdateLessonBodySchema,
    responses: {
        200: {
            description: "Lesson updated successfully",
            schema: getResponseSuccessSchema(UpdateLessonResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.DELETE,
    path: "/komplex-admin/curriculums/lessons/:id",
    summary: "Delete a lesson",
    tag: "Admin Curriculums",
    responses: {
        200: {
            description: "Lesson deleted successfully",
            schema: getResponseSuccessSchema(DeleteLessonResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.POST,
    path: "/komplex-admin/curriculums/topics",
    summary: "Create a topic",
    tag: "Admin Curriculums",
    body: CreateTopicBodySchema,
    responses: {
        201: {
            description: "Topic created successfully",
            schema: getResponseSuccessSchema(CreateTopicResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.PUT,
    path: "/komplex-admin/curriculums/topics/:id",
    summary: "Update topic component",
    tag: "Admin Curriculums",
    body: UpdateTopicComponentBodySchema,
    responses: {
        200: {
            description: "Topic component updated successfully",
            schema: getResponseSuccessSchema(UpdateTopicComponentResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.PATCH,
    path: "/komplex-admin/curriculums/topics/:id",
    summary: "Update a topic",
    tag: "Admin Curriculums",
    body: UpdateTopicBodySchema,
    responses: {
        200: {
            description: "Topic updated successfully",
            schema: getResponseSuccessSchema(UpdateTopicResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.DELETE,
    path: "/komplex-admin/curriculums/topics/:id",
    summary: "Delete a topic",
    tag: "Admin Curriculums",
    responses: {
        200: {
            description: "Topic deleted successfully",
            schema: getResponseSuccessSchema(DeleteTopicResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

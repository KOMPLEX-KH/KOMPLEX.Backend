import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import {
    adminGetSmallContentRateLimiter,
    adminSmallPostRateLimiter,
    adminSmallUpdateRateLimiter,
    adminSmallDeleteRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getExercises as getAdminExercises, GetExercisesQuerySchema, GetExercisesResponse } from "../exercises/get.js";
import { createExercise, CreateExerciseBodySchema, CreateExerciseResponseSchema } from "../exercises/post.js";
import { getExercise as getAdminExercise, GetExerciseParamsSchema, GetExerciseResponseSchema } from "../exercises/[id]/get.js";
import { updateExercise, UpdateExerciseParamsSchema, UpdateExerciseBodySchema, UpdateExerciseResponseSchema } from "../exercises/[id]/put.js";
import { deleteExercise, DeleteExerciseParamsSchema, DeleteExerciseResponseSchema } from "../exercises/[id]/delete.js";
import { getExerciseDashboard, GetExerciseDashboardResponseSchema } from "../exercises/dashboard/get.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";

const router = Router();

// ============================================================================
// Admin Exercises Routes
// ============================================================================
router.get(
    "",
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getAdminExercises as any
);
router.post("", verifyFirebaseTokenAdmin as any, adminSmallPostRateLimiter, createExercise as any);
router.get(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getAdminExercise as any
);
router.put(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateExercise as any
);
router.delete(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    deleteExercise as any
);
router.get(
    "/dashboard",
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getExerciseDashboard as any
);

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.GET,
    path: "/komplex-admin/exercises",
    summary: "Get all exercises",
    tag: "Admin Exercises",
    query: GetExercisesQuerySchema,
    responses: {
        200: {
            description: "Exercises retrieved successfully",
            schema: getResponseSuccessSchema(GetExercisesResponse),
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
    path: "/komplex-admin/exercises",
    summary: "Create a new exercise",
    tag: "Admin Exercises",
    body: CreateExerciseBodySchema,
    responses: {
        201: {
            description: "Exercise created successfully",
            schema: getResponseSuccessSchema(CreateExerciseResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.GET,
    path: "/komplex-admin/exercises/:id",
    summary: "Get exercise by ID",
    tag: "Admin Exercises",
    responses: {
        200: {
            description: "Exercise retrieved successfully",
            schema: getResponseSuccessSchema(GetExerciseResponseSchema),
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
    path: "/komplex-admin/exercises/:id",
    summary: "Update an exercise",
    tag: "Admin Exercises",
    body: UpdateExerciseBodySchema,
    responses: {
        200: {
            description: "Exercise updated successfully",
            schema: getResponseSuccessSchema(UpdateExerciseResponseSchema),
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
    path: "/komplex-admin/exercises/:id",
    summary: "Delete an exercise",
    tag: "Admin Exercises",
    responses: {
        200: {
            description: "Exercise deleted successfully",
            schema: getResponseSuccessSchema(DeleteExerciseResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.GET,
    path: "/komplex-admin/exercises/dashboard",
    summary: "Get exercise dashboard",
    tag: "Admin Exercises",
    responses: {
        200: {
            description: "Exercise dashboard retrieved successfully",
            schema: getResponseSuccessSchema(GetExerciseDashboardResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

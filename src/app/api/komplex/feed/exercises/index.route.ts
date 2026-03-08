import Router from "express";
import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import { getSmallContentRateLimiter } from "@/middleware/rateLimiter.js";
import { getExercises, FeedExercisesResponseSchema } from "../../feed/exercises/get.js";
import { getExerciseById } from "../../feed/exercises/[id]/get.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

const router = Router();

// ============================================================================
// Feed Exercises Routes
// ============================================================================
router.get("", verifyFirebaseTokenOptional as any, getSmallContentRateLimiter, getExercises as any);
router.get("/:id", verifyFirebaseTokenOptional as any, getSmallContentRateLimiter, getExerciseById as any);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/exercises",
    summary: "Get all exercises",
    tag: "Feed",
    responses: {
        200: {
            description: "Exercises retrieved successfully",
            schema: getResponseSuccessSchema(FeedExercisesResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/exercises/:id",
    summary: "Get exercise by ID",
    tag: "Feed",
    responses: {
        200: {
            description: "Exercise retrieved successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

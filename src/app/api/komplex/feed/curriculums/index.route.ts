import Router from "express";
import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import { getSmallContentRateLimiter } from "@/middleware/rateLimiter.js";
import { getCurriculums, FeedCurriculumsResponseSchema } from "../../feed/curriculums/get.js";
import { getCurriculumTopic } from "../../feed/curriculums/[id]/get.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/responseError.js";
import { z } from "@/config/openapi/openapi.js";

const router = Router();

// ============================================================================
// Feed Curriculums Routes
// ============================================================================
router.get("", verifyFirebaseTokenOptional as any, getSmallContentRateLimiter, getCurriculums as any);
router.get("/:id", verifyFirebaseTokenOptional as any, getSmallContentRateLimiter, getCurriculumTopic as any);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/curriculums",
    summary: "Get all curriculums",
    tag: "Feed",
    responses: {
        200: {
            description: "Curriculums retrieved successfully",
            schema: getResponseSuccessSchema(FeedCurriculumsResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/curriculums/:id",
    summary: "Get curriculum topic by ID",
    tag: "Feed",
    responses: {
        200: {
            description: "Curriculum topic retrieved successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

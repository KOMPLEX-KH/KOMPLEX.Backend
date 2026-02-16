import Router from "express";
import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import { getSmallContentRateLimiter } from "@/middleware/rateLimiter.js";
import { getAllNews, FeedNewsResponseSchema } from "../../feed/news/get.js";
import { getNewsById } from "../../feed/news/[id]/get.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

const router = Router();

// ============================================================================
// Feed News Routes
// ============================================================================
router.get("", verifyFirebaseTokenOptional as any, getSmallContentRateLimiter, getAllNews as any);
router.get("/:id", verifyFirebaseTokenOptional as any, getSmallContentRateLimiter, getNewsById as any);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/news",
    summary: "Get all news",
    tag: "Feed",
    responses: {
        200: {
            description: "News retrieved successfully",
            schema: getResponseSuccessSchema(FeedNewsResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/news/:id",
    summary: "Get news by ID",
    tag: "Feed",
    responses: {
        200: {
            description: "News retrieved successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

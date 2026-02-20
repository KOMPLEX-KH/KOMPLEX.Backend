import Router from "express";
import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import { getVideoRateLimiter } from "@/middleware/rateLimiter.js";
import { getAllVideos, FeedVideoItemSchema } from "../../feed/videos/get.js";
import { getVideoById } from "../../feed/videos/[id]/get.js";
import { getRecommendedVideos } from "../../feed/videos/[id]/recommended/get.js";
import { getVideoLikes } from "../../feed/videos/[id]/likes/get.js";
import { getVideoComments } from "../../feed/videos/[id]/comments/get.js";
import { getVideoReplies } from "../../feed/videos/[id]/comments/[id]/replies/get.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

const router = Router();

// ============================================================================
// Feed Videos Routes
// ============================================================================
router.get("", verifyFirebaseTokenOptional as any, getVideoRateLimiter, getAllVideos as any);
router.get("/:id", verifyFirebaseTokenOptional as any, getVideoRateLimiter, getVideoById as any);
router.get(
    "/:id/recommended",
    verifyFirebaseTokenOptional as any,
    getVideoRateLimiter,
    getRecommendedVideos as any
);
router.get("/:id/likes", getVideoLikes as any);
router.get("/:id/comments", getVideoComments as any);
router.get("/:id/comments/:id/replies", getVideoReplies as any);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/videos",
    summary: "Get all videos",
    tag: "Feed",
    responses: {
        200: {
            description: "Videos retrieved successfully",
            schema: getResponseSuccessSchema(FeedVideoItemSchema.array()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/videos/:id",
    summary: "Get video by ID",
    tag: "Feed",
    responses: {
        200: {
            description: "Video retrieved successfully",
            schema: getResponseSuccessSchema(FeedVideoItemSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/videos/:id/recommended",
    summary: "Get recommended videos",
    tag: "Feed",
    responses: {
        200: {
            description: "Recommended videos retrieved successfully",
            schema: getResponseSuccessSchema(FeedVideoItemSchema.array()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/videos/:id/likes",
    summary: "Get video likes",
    tag: "Feed",
    responses: {
        200: {
            description: "Video likes retrieved successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/videos/:id/comments",
    summary: "Get video comments",
    tag: "Feed",
    responses: {
        200: {
            description: "Video comments retrieved successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/videos/:id/comments/:id/replies",
    summary: "Get video comment replies",
    tag: "Feed",
    responses: {
        200: {
            description: "Video comment replies retrieved successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

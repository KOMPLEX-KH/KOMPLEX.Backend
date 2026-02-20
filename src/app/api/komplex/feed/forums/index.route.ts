import Router from "express";
import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import { getBigContentRateLimiter } from "@/middleware/rateLimiter.js";
import { getAllForums as getAllFeedForums } from "../../feed/forums/get.js";
import { getForumById, FeedForumItemResponseSchema } from "../../feed/forums/[id]/get.js";
import { getForumComments, FeedForumCommentItemResponseSchema } from "../../feed/forums/[id]/comments/get.js";
import { getForumReplies, FeedForumReplyItemResponseSchema } from "./[id]/comments/[commentId]/replies/get.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";
import { FeedForumItemSchema } from "../../feed/forums/get.js";

const router = Router();

// ============================================================================
// Feed Forums Routes
// ============================================================================
router.get("", verifyFirebaseTokenOptional as any, getBigContentRateLimiter, getAllFeedForums as any);
router.get("/:id", verifyFirebaseTokenOptional as any, getBigContentRateLimiter, getForumById as any);
router.get("/:id/comments", verifyFirebaseTokenOptional as any, getBigContentRateLimiter, getForumComments as any);
router.get("/comments/:commentId/replies", verifyFirebaseTokenOptional as any, getBigContentRateLimiter, getForumReplies as any);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/forums",
    summary: "Get all forums",
    tag: "Feed",
    responses: {
        200: {
            description: "Forums retrieved successfully",
            schema: getResponseSuccessSchema(FeedForumItemSchema.array()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/forums/:id",
    summary: "Get forum by ID",
    tag: "Feed",
    responses: {
        200: {
            description: "Forum retrieved successfully",
            schema: getResponseSuccessSchema(FeedForumItemResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/forums/:id/comments",
    summary: "Get forum comments",
    tag: "Feed",
    responses: {
        200: {
            description: "Forum comments retrieved successfully",
            schema: getResponseSuccessSchema(FeedForumCommentItemResponseSchema.array()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/feed/forums/comments/:commentId/replies",
    summary: "Get forum comment replies",
    tag: "Feed",
    responses: {
        200: {
            description: "Forum comment replies retrieved successfully",
            schema: getResponseSuccessSchema(FeedForumReplyItemResponseSchema.array()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

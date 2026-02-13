import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import {
    adminBigPostRateLimiter,
    adminBigUpdateRateLimiter,
    adminSmallPostRateLimiter,
    adminSmallDeleteRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getAllRepliesForAComment as getAllAdminRepliesForAComment, AdminGetForumRepliesParamsSchema, AdminGetForumRepliesResponseSchema } from "../forum_replies/[id]/get.js";
import { postForumReply as postAdminForumReply, AdminPostForumReplyBodySchema, AdminPostForumReplyResponseSchema } from "../forum_replies/[id]/post.js";
import { updateForumReply as updateAdminForumReply, AdminUpdateForumReplyParamsSchema, AdminUpdateForumReplyBodySchema, AdminUpdateForumReplyResponseSchema } from "../forum_replies/[id]/patch.js";
import { likeForumReply as likeAdminForumReply, AdminLikeForumReplyBodySchema, AdminLikeForumReplyResponseSchema } from "../forum_replies/[id]/like/post.js";
import { unlikeForumReply as unlikeAdminForumReply, AdminUnlikeForumReplyBodySchema, AdminUnlikeForumReplyResponseSchema } from "../forum_replies/[id]/unlike/delete.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/responseError.js";

const router = Router();

// ============================================================================
// Admin Forum Replies Routes
// ============================================================================
router.get("/:id", verifyFirebaseTokenAdmin as any, getAllAdminRepliesForAComment as any);
router.post("/:id", verifyFirebaseTokenAdmin as any, adminBigPostRateLimiter, postAdminForumReply as any);
router.patch("/:id", verifyFirebaseTokenAdmin as any, adminBigUpdateRateLimiter, updateAdminForumReply as any);
router.post("/:id/like", verifyFirebaseTokenAdmin as any, adminSmallPostRateLimiter, likeAdminForumReply as any);
router.delete(
    "/:id/unlike",
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    unlikeAdminForumReply as any
);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex-admin/forum_replies/:id",
    summary: "Get all replies for a comment",
    tag: "Admin Forum Replies",
    responses: {
        200: {
            description: "Replies retrieved successfully",
            schema: getResponseSuccessSchema(AdminGetForumRepliesResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex-admin/forum_replies/:id",
    summary: "Post a forum reply",
    tag: "Admin Forum Replies",
    body: AdminPostForumReplyBodySchema,
    responses: {
        201: {
            description: "Reply posted successfully",
            schema: getResponseSuccessSchema(AdminPostForumReplyResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.PATCH,
    path: "/komplex-admin/forum_replies/:id",
    summary: "Update a forum reply",
    tag: "Admin Forum Replies",
    body: AdminUpdateForumReplyBodySchema,
    responses: {
        200: {
            description: "Reply updated successfully",
            schema: getResponseSuccessSchema(AdminUpdateForumReplyResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex-admin/forum_replies/:id/like",
    summary: "Like a forum reply",
    tag: "Admin Forum Replies",
    body: AdminLikeForumReplyBodySchema,
    responses: {
        200: {
            description: "Reply liked successfully",
            schema: getResponseSuccessSchema(AdminLikeForumReplyResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.DELETE,
    path: "/komplex-admin/forum_replies/:id/unlike",
    summary: "Unlike a forum reply",
    tag: "Admin Forum Replies",
    body: AdminUnlikeForumReplyBodySchema,
    responses: {
        200: {
            description: "Reply unliked successfully",
            schema: getResponseSuccessSchema(AdminUnlikeForumReplyResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

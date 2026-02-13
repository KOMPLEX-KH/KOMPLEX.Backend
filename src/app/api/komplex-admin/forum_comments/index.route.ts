import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import {
    adminBigPostRateLimiter,
    adminBigUpdateRateLimiter,
    adminSmallPostRateLimiter,
    adminSmallDeleteRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getAllCommentsForAForum as getAllAdminCommentsForAForum, GetAllCommentsForAForumParamsSchema, GetAllCommentsForAForumResponseSchema } from "../forum_comments/[id]/get.js";
import { postForumComment as postAdminForumComment, PostForumCommentParamsSchema, PostForumCommentBodySchema, PostForumCommentResponseSchema } from "../forum_comments/[id]/post.js";
import { updateForumComment as updateAdminForumComment, UpdateForumCommentParamsSchema, UpdateForumCommentBodySchema, UpdateForumCommentResponseSchema } from "../forum_comments/[id]/patch.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/responseError.js";

const router = Router();

// ============================================================================
// Admin Forum Comments Routes
// ============================================================================
router.get("/:id", verifyFirebaseTokenAdmin as any, getAllAdminCommentsForAForum as any);
router.post("/:id", verifyFirebaseTokenAdmin as any, adminBigPostRateLimiter, postAdminForumComment as any);
router.patch("/:id", verifyFirebaseTokenAdmin as any, adminBigUpdateRateLimiter, updateAdminForumComment as any);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex-admin/forum_comments/:id",
    summary: "Get all comments for a forum",
    tag: "Admin Forum Comments",
    responses: {
        200: {
            description: "Comments retrieved successfully",
            schema: getResponseSuccessSchema(GetAllCommentsForAForumResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex-admin/forum_comments/:id",
    summary: "Post a forum comment",
    tag: "Admin Forum Comments",
    body: PostForumCommentBodySchema,
    responses: {
        201: {
            description: "Comment posted successfully",
            schema: getResponseSuccessSchema(PostForumCommentResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.PATCH,
    path: "/komplex-admin/forum_comments/:id",
    summary: "Update a forum comment",
    tag: "Admin Forum Comments",
    body: UpdateForumCommentBodySchema,
    responses: {
        200: {
            description: "Comment updated successfully",
            schema: getResponseSuccessSchema(UpdateForumCommentResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

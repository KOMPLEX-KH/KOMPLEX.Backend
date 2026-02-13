import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import {
    getBigContentRateLimiter,
    postBigRateLimiter,
    updateBigRateLimiter,
    deleteBigRateLimiter,
    updateSmallRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getAllForums as getAllMyForums, MeGetForumsQuerySchema, MeGetForumsResponseSchema } from "../../me/forums/get.js";
import { postForum, MePostForumBodySchema, MePostForumResponseSchema } from "../../me/forums/post.js";
import { updateForum } from "../../me/forums/[id]/put.js";
import { deleteForum, MeDeleteForumParamsSchema, MeDeleteForumResponseSchema } from "../../me/forums/[id]/delete.js";
import { likeForum, MeLikeForumParamsSchema, MeLikeForumResponseSchema } from "../../me/forums/[id]/like/patch.js";
import { unlikeForum } from "../../me/forums/[id]/unlike/patch.js";
import { postForumComment, MePostForumCommentParamsSchema, MePostForumCommentBodySchema, MePostForumCommentResponseSchema } from "../../me/forums/[id]/comments/post.js";
import { updateForumComment } from "../../me/forums/[id]/comments/[id]/put.js";
import { deleteForumComment } from "../../me/forums/[id]/comments/[id]/delete.js";
import { likeForumComment } from "../../me/forums/[id]/comments/[id]/like/patch.js";
import { unlikeForumComment } from "../../me/forums/[id]/comments/[id]/unlike/patch.js";
import { postForumReply } from "../../me/forums/[id]/comments/[id]/replies/post.js";
import { updateForumReply } from "../../me/forums/[id]/comments/[id]/replies/[id]/put.js";
import { deleteForumReply } from "../../me/forums/[id]/comments/[id]/replies/[id]/delete.js";
import { likeForumReply } from "../../me/forums/[id]/comments/[id]/replies/[id]/like/patch.js";
import { unlikeForumReply } from "../../me/forums/[id]/comments/[id]/replies/[id]/unlike/patch.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/responseError.js";
import { z } from "@/config/openapi/openapi.js";

const router = Router();

// ============================================================================
// Me Forums Routes
// ============================================================================
router.get("", verifyFirebaseToken as any, getBigContentRateLimiter, getAllMyForums as any);
router.post("", verifyFirebaseToken as any, postBigRateLimiter, postForum as any);
router.put("/:id", verifyFirebaseToken as any, updateBigRateLimiter, updateForum as any);
router.delete("/:id", verifyFirebaseToken as any, deleteBigRateLimiter, deleteForum as any);
router.patch("/:id/like", verifyFirebaseToken as any, updateSmallRateLimiter, likeForum as any);
router.patch("/:id/unlike", verifyFirebaseToken as any, updateSmallRateLimiter, unlikeForum as any);
router.post(
    "/:id/comments",
    verifyFirebaseToken as any,
    postBigRateLimiter,
    postForumComment as any
);
router.put(
    "/:id/comments/:id",
    verifyFirebaseToken as any,
    updateBigRateLimiter,
    updateForumComment as any
);
router.delete(
    "/:id/comments/:id",
    verifyFirebaseToken as any,
    deleteBigRateLimiter,
    deleteForumComment as any
);
router.patch(
    "/:id/comments/:id/like",
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    likeForumComment as any
);
router.patch(
    "/:id/comments/:id/unlike",
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    unlikeForumComment as any
);
router.post(
    "/:id/comments/:id/replies",
    verifyFirebaseToken as any,
    postBigRateLimiter,
    postForumReply as any
);
router.put(
    "/:id/comments/:id/replies/:id",
    verifyFirebaseToken as any,
    updateBigRateLimiter,
    updateForumReply as any
);
router.delete(
    "/:id/comments/:id/replies/:id",
    verifyFirebaseToken as any,
    deleteBigRateLimiter,
    deleteForumReply as any
);
router.patch(
    "/:id/comments/:id/replies/:id/like",
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    likeForumReply as any
);
router.patch(
    "/:id/comments/:id/replies/:id/unlike",
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    unlikeForumReply as any
);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/me/forums",
    summary: "Get all my forums",
    tag: "Me",
    query: MeGetForumsQuerySchema,
    responses: {
        200: {
            description: "Forums retrieved successfully",
            schema: getResponseSuccessSchema(MeGetForumsResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/me/forums",
    summary: "Post a new forum",
    tag: "Me",
    body: MePostForumBodySchema,
    responses: {
        201: {
            description: "Forum posted successfully",
            schema: getResponseSuccessSchema(MePostForumResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.PUT,
    path: "/komplex/me/forums/:id",
    summary: "Update a forum",
    tag: "Me",
    responses: {
        200: {
            description: "Forum updated successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.DELETE,
    path: "/komplex/me/forums/:id",
    summary: "Delete a forum",
    tag: "Me",
    responses: {
        200: {
            description: "Forum deleted successfully",
            schema: getResponseSuccessSchema(MeDeleteForumResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.PATCH,
    path: "/komplex/me/forums/:id/like",
    summary: "Like a forum",
    tag: "Me",
    responses: {
        200: {
            description: "Forum liked successfully",
            schema: getResponseSuccessSchema(MeLikeForumResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.PATCH,
    path: "/komplex/me/forums/:id/unlike",
    summary: "Unlike a forum",
    tag: "Me",
    responses: {
        200: {
            description: "Forum unliked successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/me/forums/:id/comments",
    summary: "Post a forum comment",
    tag: "Me",
    body: MePostForumCommentBodySchema,
    responses: {
        201: {
            description: "Comment posted successfully",
            schema: getResponseSuccessSchema(MePostForumCommentResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.PUT,
    path: "/komplex/me/forums/:id/comments/:id",
    summary: "Update a forum comment",
    tag: "Me",
    responses: {
        200: {
            description: "Comment updated successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.DELETE,
    path: "/komplex/me/forums/:id/comments/:id",
    summary: "Delete a forum comment",
    tag: "Me",
    responses: {
        200: {
            description: "Comment deleted successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.PATCH,
    path: "/komplex/me/forums/:id/comments/:id/like",
    summary: "Like a forum comment",
    tag: "Me",
    responses: {
        200: {
            description: "Comment liked successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.PATCH,
    path: "/komplex/me/forums/:id/comments/:id/unlike",
    summary: "Unlike a forum comment",
    tag: "Me",
    responses: {
        200: {
            description: "Comment unliked successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/me/forums/:id/comments/:id/replies",
    summary: "Post a forum comment reply",
    tag: "Me",
    responses: {
        201: {
            description: "Reply posted successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.PUT,
    path: "/komplex/me/forums/:id/comments/:id/replies/:id",
    summary: "Update a forum comment reply",
    tag: "Me",
    responses: {
        200: {
            description: "Reply updated successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.DELETE,
    path: "/komplex/me/forums/:id/comments/:id/replies/:id",
    summary: "Delete a forum comment reply",
    tag: "Me",
    responses: {
        200: {
            description: "Reply deleted successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.PATCH,
    path: "/komplex/me/forums/:id/comments/:id/replies/:id/like",
    summary: "Like a forum comment reply",
    tag: "Me",
    responses: {
        200: {
            description: "Reply liked successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.PATCH,
    path: "/komplex/me/forums/:id/comments/:id/replies/:id/unlike",
    summary: "Unlike a forum comment reply",
    tag: "Me",
    responses: {
        200: {
            description: "Reply unliked successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

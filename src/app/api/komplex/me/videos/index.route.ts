import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import {
    getVideoRateLimiter,
    postVideoRateLimiter,
    updateVideoRateLimiter,
    deleteVideoRateLimiter,
    updateSmallRateLimiter,
    updateBigRateLimiter,
    postBigRateLimiter,
    deleteBigRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getAllMyVideos, MeGetMyVideosQuerySchema, MeGetMyVideosResponseSchema } from "../../me/videos/get.js";
import { postVideo, MePostVideoBodySchema, MePostVideoResponseSchema } from "../../me/videos/post.js";
import { updateVideo } from "../../me/videos/[id]/put.js";
import { deleteVideo, MeDeleteVideoParamsSchema, MeDeleteVideoResponseSchema } from "../../me/videos/[id]/delete.js";
import { likeVideo } from "../../me/videos/[id]/like/patch.js";
import { unlikeVideo } from "../../me/videos/[id]/unlike/patch.js";
import { postVideoComment } from "../../me/videos/[id]/comments/post.js";
import { updateVideoComment } from "../../me/videos/[id]/comments/[id]/put.js";
import { deleteVideoComment } from "../../me/videos/[id]/comments/[id]/delete.js";
import { likeVideoComment } from "../../me/videos/[id]/comments/[id]/like/patch.js";
import { unlikeVideoComment } from "../../me/videos/[id]/comments/[id]/unlike/patch.js";
import { postVideoReply } from "../../me/videos/[id]/comments/[id]/replies/post.js";
import { updateVideoReply } from "../../me/videos/[id]/comments/[id]/replies/[id]/put.js";
import { deleteVideoReply } from "../../me/videos/[id]/comments/[id]/replies/[id]/delete.js";
import { likeVideoReply } from "../../me/videos/[id]/comments/[id]/replies/[id]/like/patch.js";
import { unlikeVideoReply } from "../../me/videos/[id]/comments/[id]/replies/[id]/unlike/patch.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/responseError.js";
import { z } from "@/config/openapi/openapi.js";

const router = Router();

// ============================================================================
// Me Videos Routes
// ============================================================================
router.get("", verifyFirebaseToken as any, getVideoRateLimiter, getAllMyVideos as any);
router.post("", verifyFirebaseToken as any, postVideoRateLimiter, postVideo as any);
router.put("/:id", verifyFirebaseToken as any, updateVideoRateLimiter, updateVideo as any);
router.delete("/:id", verifyFirebaseToken as any, deleteVideoRateLimiter, deleteVideo as any);
router.patch("/:id/like", verifyFirebaseToken as any, updateSmallRateLimiter, likeVideo as any);
router.patch("/:id/unlike", verifyFirebaseToken as any, updateSmallRateLimiter, unlikeVideo as any);
router.post(
    "/:id/comments",
    verifyFirebaseToken as any,
    postBigRateLimiter,
    postVideoComment as any
);
router.put(
    "/:id/comments/:id",
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    updateVideoComment as any
);
router.delete(
    "/:id/comments/:id",
    verifyFirebaseToken as any,
    deleteBigRateLimiter,
    deleteVideoComment as any
);
router.patch(
    "/:id/comments/:id/like",
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    likeVideoComment as any
);
router.patch(
    "/:id/comments/:id/unlike",
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    unlikeVideoComment as any
);
router.post(
    "/:id/comments/:id/replies",
    verifyFirebaseToken as any,
    postBigRateLimiter,
    postVideoReply as any
);
router.put(
    "/:id/comments/:id/replies/:id",
    verifyFirebaseToken as any,
    updateBigRateLimiter,
    updateVideoReply as any
);
router.delete(
    "/:id/comments/:id/replies/:id",
    verifyFirebaseToken as any,
    deleteBigRateLimiter,
    deleteVideoReply as any
);
router.patch(
    "/:id/comments/:id/replies/:id/like",
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    likeVideoReply as any
);
router.patch(
    "/:id/comments/:id/replies/:id/unlike",
    verifyFirebaseToken as any,
    updateSmallRateLimiter,
    unlikeVideoReply as any
);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/me/videos",
    summary: "Get all my videos",
    tag: "Me",
    query: MeGetMyVideosQuerySchema,
    responses: {
        200: {
            description: "Videos retrieved successfully",
            schema: getResponseSuccessSchema(MeGetMyVideosResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/me/videos",
    summary: "Post a new video",
    tag: "Me",
    body: MePostVideoBodySchema,
    responses: {
        201: {
            description: "Video posted successfully",
            schema: getResponseSuccessSchema(MePostVideoResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.PUT,
    path: "/komplex/me/videos/:id",
    summary: "Update a video",
    tag: "Me",
    responses: {
        200: {
            description: "Video updated successfully",
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
    path: "/komplex/me/videos/:id",
    summary: "Delete a video",
    tag: "Me",
    responses: {
        200: {
            description: "Video deleted successfully",
            schema: getResponseSuccessSchema(MeDeleteVideoResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.PATCH,
    path: "/komplex/me/videos/:id/like",
    summary: "Like a video",
    tag: "Me",
    responses: {
        200: {
            description: "Video liked successfully",
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
    path: "/komplex/me/videos/:id/unlike",
    summary: "Unlike a video",
    tag: "Me",
    responses: {
        200: {
            description: "Video unliked successfully",
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
    path: "/komplex/me/videos/:id/comments",
    summary: "Post a video comment",
    tag: "Me",
    responses: {
        201: {
            description: "Comment posted successfully",
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
    path: "/komplex/me/videos/:id/comments/:id",
    summary: "Update a video comment",
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
    path: "/komplex/me/videos/:id/comments/:id",
    summary: "Delete a video comment",
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
    path: "/komplex/me/videos/:id/comments/:id/like",
    summary: "Like a video comment",
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
    path: "/komplex/me/videos/:id/comments/:id/unlike",
    summary: "Unlike a video comment",
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
    path: "/komplex/me/videos/:id/comments/:id/replies",
    summary: "Post a video comment reply",
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
    path: "/komplex/me/videos/:id/comments/:id/replies/:id",
    summary: "Update a video comment reply",
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
    path: "/komplex/me/videos/:id/comments/:id/replies/:id",
    summary: "Delete a video comment reply",
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
    path: "/komplex/me/videos/:id/comments/:id/replies/:id/like",
    summary: "Like a video comment reply",
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
    path: "/komplex/me/videos/:id/comments/:id/replies/:id/unlike",
    summary: "Unlike a video comment reply",
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

import Router from "express";
import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import {
    getSmallContentRateLimiter,
    getVideoRateLimiter,
    getBigContentRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getUserProfile, UserProfileResponseSchema } from "../users/[id]/profile/get.js";
import { getUserVideos, UserVideoItemSchema } from "../users/[id]/videos/get.js";
import { getUserForums, UserForumItemSchema } from "../users/[id]/forums/get.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";

const router = Router();

// ============================================================================
// Users Routes
// ============================================================================
router.get(
    "/:id/profile",
    verifyFirebaseTokenOptional as any,
    getSmallContentRateLimiter,
    getUserProfile as any
);
router.get(
    "/:id/videos",
    verifyFirebaseTokenOptional as any,
    getVideoRateLimiter,
    getUserVideos as any
);
router.get(
    "/:id/forums",
    verifyFirebaseTokenOptional as any,
    getBigContentRateLimiter,
    getUserForums as any
);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/users/:id/profile",
    summary: "Get user profile",
    tag: "Users",
    responses: {
        200: {
            description: "User profile retrieved successfully",
            schema: getResponseSuccessSchema(UserProfileResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/users/:id/videos",
    summary: "Get user videos",
    tag: "Users",
    responses: {
        200: {
            description: "User videos retrieved successfully",
            schema: getResponseSuccessSchema(UserVideoItemSchema.array()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/users/:id/forums",
    summary: "Get user forums",
    tag: "Users",
    responses: {
        200: {
            description: "User forums retrieved successfully",
            schema: getResponseSuccessSchema(UserForumItemSchema.array()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

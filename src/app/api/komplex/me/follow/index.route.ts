import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import { followLimiter } from "@/middleware/rateLimiter.js";
import { getFollowers, MeFollowersQuerySchema, MeFollowersResponseSchema } from "../../me/follow/followers/get.js";
import { getFollowing, MeFollowingQuerySchema, MeFollowingResponseSchema } from "../../me/follow/following/get.js";
import { followUser, MeFollowUserParamsSchema, MeFollowUserResponseSchema } from "../../me/follow/follow/[id]/post.js";
import { unfollowUser, MeUnfollowUserParamsSchema, MeUnfollowUserResponseSchema } from "../../me/follow/unfollow/[id]/post.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";

const router = Router();

// ============================================================================
// Me Follow Routes
// ============================================================================
router.get("/followers", verifyFirebaseToken as any, followLimiter, getFollowers as any);
router.get("/following", verifyFirebaseToken as any, followLimiter, getFollowing as any);
router.post("/follow/:id", verifyFirebaseToken as any, followLimiter, followUser as any);
router.post("/unfollow/:id", verifyFirebaseToken as any, followLimiter, unfollowUser as any);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/me/follow/followers",
    summary: "Get followers",
    tag: "Me",
    query: MeFollowersQuerySchema,
    responses: {
        200: {
            description: "Followers retrieved successfully",
            schema: getResponseSuccessSchema(MeFollowersResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/me/follow/following",
    summary: "Get following users",
    tag: "Me",
    query: MeFollowingQuerySchema,
    responses: {
        200: {
            description: "Following users retrieved successfully",
            schema: getResponseSuccessSchema(MeFollowingResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/me/follow/follow/:id",
    summary: "Follow a user",
    tag: "Me",
    responses: {
        200: {
            description: "User followed successfully",
            schema: getResponseSuccessSchema(MeFollowUserResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/me/follow/unfollow/:id",
    summary: "Unfollow a user",
    tag: "Me",
    responses: {
        200: {
            description: "User unfollowed successfully",
            schema: getResponseSuccessSchema(MeUnfollowUserResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

import Router from "express";
import { verifyFirebaseTokenOptional } from "@/middleware/auth.js";
import { searchRateLimiter } from "@/middleware/rateLimiter.js";
import { searchVideos, VideoSearchItemSchema } from "../search/videos/get.js";
import { searchForums, ForumSearchItemSchema } from "../search/forums/get.js";
import { searchNews, NewsSearchItemSchema } from "../search/news/get.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";

const router = Router();

// ============================================================================
// Search Routes
// ============================================================================
router.get(
    "/videos",
    verifyFirebaseTokenOptional as any,
    searchRateLimiter,
    searchVideos as any
);
router.get(
    "/forums",
    verifyFirebaseTokenOptional as any,
    searchRateLimiter,
    searchForums as any
);
router.get(
    "/news",
    verifyFirebaseTokenOptional as any,
    searchRateLimiter,
    searchNews as any
);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/search/videos",
    summary: "Search videos",
    tag: "Search",
    responses: {
        200: {
            description: "Videos retrieved successfully",
            schema: getResponseSuccessSchema(VideoSearchItemSchema.array()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/search/forums",
    summary: "Search forums",
    tag: "Search",
    responses: {
        200: {
            description: "Forums retrieved successfully",
            schema: getResponseSuccessSchema(ForumSearchItemSchema.array()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/search/news",
    summary: "Search news",
    tag: "Search",
    responses: {
        200: {
            description: "News retrieved successfully",
            schema: getResponseSuccessSchema(NewsSearchItemSchema.array()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

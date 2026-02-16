import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import { adminGetVideoRateLimiter } from "@/middleware/rateLimiter.js";
import { getAllVideos as getAllAdminVideos, AdminGetVideosQuerySchema, AdminGetVideosResponseSchema } from "../videos/get.js";
import { getVideoById as getAdminVideoById, AdminGetVideoByIdParamsSchema, AdminGetVideoByIdResponseSchema } from "../videos/[id]/get.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";

const router = Router();

// ============================================================================
// Admin Videos Routes
// ============================================================================
router.get("", verifyFirebaseTokenAdmin as any, adminGetVideoRateLimiter, getAllAdminVideos as any);
router.get(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminGetVideoRateLimiter,
    getAdminVideoById as any
);

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.GET,
    path: "/komplex-admin/videos",
    summary: "Get all videos",
    tag: "Admin Videos",
    query: AdminGetVideosQuerySchema,
    responses: {
        200: {
            description: "Videos retrieved successfully",
            schema: getResponseSuccessSchema(AdminGetVideosResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.GET,
    path: "/komplex-admin/videos/:id",
    summary: "Get video by ID",
    tag: "Admin Videos",
    responses: {
        200: {
            description: "Video retrieved successfully",
            schema: getResponseSuccessSchema(AdminGetVideoByIdResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import {
    adminSmallPostRateLimiter,
    adminSmallUpdateRateLimiter,
    adminSmallDeleteRateLimiter,
} from "@/middleware/rateLimiter.js";
import { postNews, AdminPostNewsBodySchema, AdminPostNewsResponseSchema } from "../news/post.js";
import { updateNews, AdminUpdateNewsParamsSchema, AdminUpdateNewsBodySchema, AdminUpdateNewsResponseSchema } from "../news/[id]/put.js";
import { deleteNews, AdminDeleteNewsParamsSchema, AdminDeleteNewsResponseSchema } from "../news/[id]/delete.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/responseError.js";

const router = Router();

// ============================================================================
// Admin News Routes
// ============================================================================
router.post("", verifyFirebaseTokenAdmin as any, adminSmallPostRateLimiter, postNews as any);
router.put(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateNews as any
);
router.delete(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    deleteNews as any
);

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.POST,
    path: "/komplex-admin/news",
    summary: "Create a new news item",
    tag: "Admin News",
    body: AdminPostNewsBodySchema,
    responses: {
        201: {
            description: "News created successfully",
            schema: getResponseSuccessSchema(AdminPostNewsResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.PUT,
    path: "/komplex-admin/news/:id",
    summary: "Update a news item",
    tag: "Admin News",
    body: AdminUpdateNewsBodySchema,
    responses: {
        200: {
            description: "News updated successfully",
            schema: getResponseSuccessSchema(AdminUpdateNewsResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.DELETE,
    path: "/komplex-admin/news/:id",
    summary: "Delete a news item",
    tag: "Admin News",
    responses: {
        200: {
            description: "News deleted successfully",
            schema: getResponseSuccessSchema(AdminDeleteNewsResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

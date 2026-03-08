import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import {
    adminGetBigContentRateLimiter,
    adminBigUpdateRateLimiter,
    adminBigDeleteRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getAllForums as getAllAdminForums, AdminGetForumsQuerySchema, AdminGetForumsResponseSchema } from "../forums/get.js";
import { getForumById as getAdminForumById, AdminGetForumByIdParamsSchema, AdminGetForumByIdResponseSchema } from "../forums/[id]/get.js";
import { updateForum as updateAdminForum, AdminUpdateForumParamsSchema, AdminUpdateForumBodySchema, AdminUpdateForumResponseSchema } from "../forums/[id]/put.js";
import { deleteForum as deleteAdminForum, AdminDeleteForumParamsSchema, AdminDeleteForumResponseSchema } from "../forums/[id]/delete.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";

const router = Router();

// ============================================================================
// Admin Forums Routes
// ============================================================================
router.get(
    "",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAllAdminForums as any
);
router.get(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAdminForumById as any
);
router.put(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminBigUpdateRateLimiter,
    updateAdminForum as any
);
router.delete(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminBigDeleteRateLimiter,
    deleteAdminForum as any
);

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.GET,
    path: "/komplex-admin/forums",
    summary: "Get all forums",
    tag: "Admin Forums",
    query: AdminGetForumsQuerySchema,
    responses: {
        200: {
            description: "Forums retrieved successfully",
            schema: getResponseSuccessSchema(AdminGetForumsResponseSchema),
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
    path: "/komplex-admin/forums/:id",
    summary: "Get forum by ID",
    tag: "Admin Forums",
    responses: {
        200: {
            description: "Forum retrieved successfully",
            schema: getResponseSuccessSchema(AdminGetForumByIdResponseSchema),
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
    path: "/komplex-admin/forums/:id",
    summary: "Update a forum",
    tag: "Admin Forums",
    body: AdminUpdateForumBodySchema,
    responses: {
        200: {
            description: "Forum updated successfully",
            schema: getResponseSuccessSchema(AdminUpdateForumResponseSchema),
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
    path: "/komplex-admin/forums/:id",
    summary: "Delete a forum",
    tag: "Admin Forums",
    responses: {
        200: {
            description: "Forum deleted successfully",
            schema: getResponseSuccessSchema(AdminDeleteForumResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;
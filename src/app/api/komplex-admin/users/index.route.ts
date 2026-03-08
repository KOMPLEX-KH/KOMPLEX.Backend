import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import { adminGetBigContentRateLimiter } from "@/middleware/rateLimiter.js";
import { getAllUsers, AdminGetUsersQuerySchema, AdminGetUsersResponseSchema } from "../users/get.js";
import { getAllAdmins, AdminGetAdminsQuerySchema, AdminGetAdminsResponseSchema } from "../users/admins/get.js";
import { createAdmin, AdminCreateAdminBodySchema, AdminCreateAdminResponseSchema } from "../users/admins/post.js";
import { updateAdmin, AdminUpdateAdminParamsSchema, AdminUpdateAdminBodySchema, AdminUpdateAdminResponseSchema } from "../users/admins/[id]/put.js";
import { deleteAdmin, AdminDeleteAdminParamsSchema, AdminDeleteAdminResponseSchema } from "../users/admins/[id]/delete.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";

const router = Router();

// ============================================================================
// Admin Users Routes
// ============================================================================
router.get("", verifyFirebaseTokenAdmin as any, adminGetBigContentRateLimiter, getAllUsers as any);
router.get("/admins", verifyFirebaseTokenAdmin as any, adminGetBigContentRateLimiter, getAllAdmins as any);
router.post("/admins", verifyFirebaseTokenAdmin as any, createAdmin as any);
router.put("/admins/:id", verifyFirebaseTokenAdmin as any, updateAdmin as any);
router.delete("/admins/:id", verifyFirebaseTokenAdmin as any, deleteAdmin as any);

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.GET,
    path: "/komplex-admin/users",
    summary: "Get all users",
    tag: "Admin Users",
    query: AdminGetUsersQuerySchema,
    responses: {
        200: {
            description: "Users retrieved successfully",
            schema: getResponseSuccessSchema(AdminGetUsersResponseSchema),
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
    path: "/komplex-admin/users/admins",
    summary: "Get all admin users",
    tag: "Admin Users",
    query: AdminGetAdminsQuerySchema,
    responses: {
        200: {
            description: "Admin users retrieved successfully",
            schema: getResponseSuccessSchema(AdminGetAdminsResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.POST,
    path: "/komplex-admin/users/admins",
    summary: "Create a new admin user",
    tag: "Admin Users",
    body: AdminCreateAdminBodySchema,
    responses: {
        201: {
            description: "Admin user created successfully",
            schema: getResponseSuccessSchema(AdminCreateAdminResponseSchema),
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
    path: "/komplex-admin/users/admins/:id",
    summary: "Update an admin user",
    tag: "Admin Users",
    body: AdminUpdateAdminBodySchema,
    responses: {
        200: {
            description: "Admin user updated successfully",
            schema: getResponseSuccessSchema(AdminUpdateAdminResponseSchema),
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
    path: "/komplex-admin/users/admins/:id",
    summary: "Delete an admin user",
    tag: "Admin Users",
    responses: {
        200: {
            description: "Admin user deleted successfully",
            schema: getResponseSuccessSchema(AdminDeleteAdminResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

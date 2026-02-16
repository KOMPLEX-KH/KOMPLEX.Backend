import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import {
    adminGetBigContentRateLimiter,
    adminGetSmallContentRateLimiter,
    adminSmallPostRateLimiter,
    adminSmallUpdateRateLimiter,
    adminSmallDeleteRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getDatabaseDashboard, DatabaseDashboardResponseSchema } from "../database/dashboard/get.js";
import { GetSchemaData as getAdminSchemaData, GetSchemaDataResponseSchema } from "../database/schema/get.js";
import { getUsers as getAdminDatabaseUsers, GetUsersResponseSchema } from "../database/users/get.js";
import { createUser as createAdminDatabaseUser, CreateUserBodySchema, CreateUserResponseSchema } from "../database/users/post.js";
import { updateUser as updateAdminDatabaseUser, UpdateUserParamsSchema, UpdateUserBodySchema, UpdateUserResponseSchema } from "../database/users/[username]/put.js";
import { deleteUser as deleteAdminDatabaseUser, DeleteUserParamsSchema, DeleteUserResponseSchema } from "../database/users/[username]/delete.js";
import { GetRoles as getAdminDatabaseRoles, GetRolesResponseSchema } from "../database/roles/get.js";
import { CreateRole as createAdminDatabaseRole, CreateRoleBodySchema, CreateRoleResponseSchema } from "../database/roles/post.js";
import { updateRoleName as updateAdminDatabaseRoleName, UpdateRoleNameParamsSchema, UpdateRoleNameBodySchema, UpdateRoleNameResponseSchema } from "../database/roles/[rolename]/put.js";
import { deleteRole as deleteAdminDatabaseRole, DeleteRoleParamsSchema, DeleteRoleResponseSchema } from "../database/roles/[rolename]/delete.js";
import { updateRolePrivileges as updateAdminDatabaseRolePrivileges, UpdateRolePrivilegesParamsSchema, UpdateRolePrivilegesBodySchema, UpdateRolePrivilegesResponseSchema } from "../database/roles/[rolename]/privileges/put.js";
import { updateRoleTableAccess as updateAdminDatabaseRoleTableAccess, UpdateRoleTableAccessParamsSchema, UpdateRoleTableAccessBodySchema, UpdateRoleTableAccessResponseSchema } from "../database/roles/[rolename]/tables/put.js";
import { GetPrivileges as getAdminDatabasePrivileges, GetPrivilegesResponseSchema } from "../database/privileges/get.js";
import { getTables as getAdminDatabaseTables, GetTablesResponseSchema } from "../database/tables/get.js";
import { executeConsoleCommand as executeAdminDatabaseConsole, ExecuteConsoleCommandBodySchema, ExecuteConsoleCommandResponseSchema } from "../database/console/post.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";

const router = Router();

// ============================================================================
// Admin Database Routes
// ============================================================================
router.get(
    "/dashboard",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getDatabaseDashboard as any
);
router.get(
    "/schema",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAdminSchemaData as any
);
router.get(
    "/users",
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getAdminDatabaseUsers as any
);
router.post(
    "/users",
    verifyFirebaseTokenAdmin as any,
    adminSmallPostRateLimiter,
    createAdminDatabaseUser as any
);
router.put(
    "/users/:username",
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateAdminDatabaseUser as any
);
router.delete(
    "/users/:username",
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    deleteAdminDatabaseUser as any
);
router.get(
    "/roles",
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getAdminDatabaseRoles as any
);
router.post(
    "/roles",
    verifyFirebaseTokenAdmin as any,
    adminSmallPostRateLimiter,
    createAdminDatabaseRole as any
);
router.put(
    "/roles/:rolename",
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateAdminDatabaseRoleName as any
);
router.delete(
    "/roles/:rolename",
    verifyFirebaseTokenAdmin as any,
    adminSmallDeleteRateLimiter,
    deleteAdminDatabaseRole as any
);
router.put(
    "/roles/:rolename/privileges",
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateAdminDatabaseRolePrivileges as any
);
router.put(
    "/roles/:rolename/tables",
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateAdminDatabaseRoleTableAccess as any
);
router.get(
    "/privileges",
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getAdminDatabasePrivileges as any
);
router.get(
    "/tables",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAdminDatabaseTables as any
);
router.post(
    "/console",
    verifyFirebaseTokenAdmin as any,
    adminSmallPostRateLimiter,
    executeAdminDatabaseConsole as any
);

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.GET,
    path: "/komplex-admin/database/dashboard",
    summary: "Get database dashboard",
    tag: "Admin Database",
    responses: {
        200: {
            description: "Database dashboard retrieved successfully",
            schema: getResponseSuccessSchema(DatabaseDashboardResponseSchema),
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
    path: "/komplex-admin/database/schema",
    summary: "Get database schema",
    tag: "Admin Database",
    responses: {
        200: {
            description: "Database schema retrieved successfully",
            schema: getResponseSuccessSchema(GetSchemaDataResponseSchema),
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
    path: "/komplex-admin/database/users",
    summary: "Get database users",
    tag: "Admin Database",
    responses: {
        200: {
            description: "Database users retrieved successfully",
            schema: getResponseSuccessSchema(GetUsersResponseSchema),
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
    path: "/komplex-admin/database/users",
    summary: "Create a database user",
    tag: "Admin Database",
    body: CreateUserBodySchema,
    responses: {
        201: {
            description: "Database user created successfully",
            schema: getResponseSuccessSchema(CreateUserResponseSchema),
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
    path: "/komplex-admin/database/users/:username",
    summary: "Update a database user",
    tag: "Admin Database",
    body: UpdateUserBodySchema,
    responses: {
        200: {
            description: "Database user updated successfully",
            schema: getResponseSuccessSchema(UpdateUserResponseSchema),
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
    path: "/komplex-admin/database/users/:username",
    summary: "Delete a database user",
    tag: "Admin Database",
    responses: {
        200: {
            description: "Database user deleted successfully",
            schema: getResponseSuccessSchema(DeleteUserResponseSchema),
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
    path: "/komplex-admin/database/roles",
    summary: "Get database roles",
    tag: "Admin Database",
    responses: {
        200: {
            description: "Database roles retrieved successfully",
            schema: getResponseSuccessSchema(GetRolesResponseSchema),
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
    path: "/komplex-admin/database/roles",
    summary: "Create a database role",
    tag: "Admin Database",
    body: CreateRoleBodySchema,
    responses: {
        201: {
            description: "Database role created successfully",
            schema: getResponseSuccessSchema(CreateRoleResponseSchema),
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
    path: "/komplex-admin/database/roles/:rolename",
    summary: "Update a database role name",
    tag: "Admin Database",
    body: UpdateRoleNameBodySchema,
    responses: {
        200: {
            description: "Database role name updated successfully",
            schema: getResponseSuccessSchema(UpdateRoleNameResponseSchema),
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
    path: "/komplex-admin/database/roles/:rolename",
    summary: "Delete a database role",
    tag: "Admin Database",
    responses: {
        200: {
            description: "Database role deleted successfully",
            schema: getResponseSuccessSchema(DeleteRoleResponseSchema),
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
    path: "/komplex-admin/database/roles/:rolename/privileges",
    summary: "Update role privileges",
    tag: "Admin Database",
    body: UpdateRolePrivilegesBodySchema,
    responses: {
        200: {
            description: "Role privileges updated successfully",
            schema: getResponseSuccessSchema(UpdateRolePrivilegesResponseSchema),
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
    path: "/komplex-admin/database/roles/:rolename/tables",
    summary: "Update role table access",
    tag: "Admin Database",
    body: UpdateRoleTableAccessBodySchema,
    responses: {
        200: {
            description: "Role table access updated successfully",
            schema: getResponseSuccessSchema(UpdateRoleTableAccessResponseSchema),
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
    path: "/komplex-admin/database/privileges",
    summary: "Get database privileges",
    tag: "Admin Database",
    responses: {
        200: {
            description: "Database privileges retrieved successfully",
            schema: getResponseSuccessSchema(GetPrivilegesResponseSchema),
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
    path: "/komplex-admin/database/tables",
    summary: "Get database tables",
    tag: "Admin Database",
    responses: {
        200: {
            description: "Database tables retrieved successfully",
            schema: getResponseSuccessSchema(GetTablesResponseSchema),
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
    path: "/komplex-admin/database/console",
    summary: "Execute console command",
    tag: "Admin Database",
    body: ExecuteConsoleCommandBodySchema,
    responses: {
        200: {
            description: "Console command executed successfully",
            schema: getResponseSuccessSchema(ExecuteConsoleCommandResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

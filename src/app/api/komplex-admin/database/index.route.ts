import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import {
    adminGetBigContentRateLimiter,
    adminGetSmallContentRateLimiter,
    adminSmallPostRateLimiter,
    adminSmallUpdateRateLimiter,
    adminSmallDeleteRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getDatabaseDashboard } from "../database/dashboard/get.js";
import { getSchemaData as getAdminSchemaData } from "../database/schema/get.js";
import { getUsers as getAdminDatabaseUsers } from "../database/users/get.js";
import { createUser as createAdminDatabaseUser } from "../database/users/post.js";
import { updateUser as updateAdminDatabaseUser } from "../database/users/[username]/put.js";
import { deleteUser as deleteAdminDatabaseUser } from "../database/users/[username]/delete.js";
import { getRoles as getAdminDatabaseRoles } from "../database/roles/get.js";
import { createRole as createAdminDatabaseRole } from "../database/roles/post.js";
import { updateRoleName as updateAdminDatabaseRoleName } from "../database/roles/[rolename]/put.js";
import { deleteRole as deleteAdminDatabaseRole } from "../database/roles/[rolename]/delete.js";
import { updateRolePrivileges as updateAdminDatabaseRolePrivileges } from "../database/roles/[rolename]/privileges/put.js";
import { updateRoleTableAccess as updateAdminDatabaseRoleTableAccess } from "../database/roles/[rolename]/tables/put.js";
import { getPrivileges as getAdminDatabasePrivileges } from "../database/privileges/get.js";
import { getTables as getAdminDatabaseTables } from "../database/tables/get.js";
import { executeConsoleCommand as executeAdminDatabaseConsole } from "../database/console/post.js";

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

export default router;

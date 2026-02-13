import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import { adminGetBigContentRateLimiter } from "@/middleware/rateLimiter.js";
import { getDashboard, DashboardResponseSchema } from "../dashboard/get.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/responseError.js";

const router = Router();

// ============================================================================
// Admin Dashboard Routes
// ============================================================================
router.get(
    "",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getDashboard as any
);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex-admin/dashboard",
    summary: "Get admin dashboard",
    tag: "Admin Dashboard",
    responses: {
        200: {
            description: "Dashboard retrieved successfully",
            schema: getResponseSuccessSchema(DashboardResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

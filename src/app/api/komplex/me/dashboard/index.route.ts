import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import { getMeDashboard, MeDashboardResponseSchema } from "../../me/dashboard/get.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/responseError.js";

const router = Router();

// ============================================================================
// Me Dashboard Routes
// ============================================================================
router.get("", verifyFirebaseToken as any, getMeDashboard as any);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/me/dashboard",
    summary: "Get user dashboard",
    tag: "Me",
    responses: {
        200: {
            description: "Dashboard retrieved successfully",
            schema: getResponseSuccessSchema(MeDashboardResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

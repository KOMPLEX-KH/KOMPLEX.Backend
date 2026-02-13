import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import { adminGetSmallContentRateLimiter } from "@/middleware/rateLimiter.js";
import { getGrades as getAdminGrades, AdminGradesResponseSchema } from "../grades/get.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/responseError.js";

const router = Router();

// ============================================================================
// Admin Grades Routes
// ============================================================================
router.get(
    "",
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getAdminGrades as any
);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex-admin/grades",
    summary: "Get all grades",
    tag: "Admin Grades",
    responses: {
        200: {
            description: "Grades retrieved successfully",
            schema: getResponseSuccessSchema(AdminGradesResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

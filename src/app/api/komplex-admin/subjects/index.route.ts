import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import { adminGetSmallContentRateLimiter } from "@/middleware/rateLimiter.js";
import { AdminSubjectsResponseSchema, getSubjects as getAdminSubjects } from "../subjects/get.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/responseError.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";

const router = Router();

// ============================================================================
// Admin Subjects Routes
// ============================================================================
router.get(
    "",
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getAdminSubjects as any
);

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.GET,
    path: "/komplex-admin/subjects",
    summary: "Get all subjects",
    tag: "Admin Subjects",
    responses: {
        200: {
            description: "Subjects retrieved successfully",
            schema: getResponseSuccessSchema(AdminSubjectsResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

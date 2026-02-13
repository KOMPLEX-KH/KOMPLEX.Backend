import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import {
    adminGetSmallContentRateLimiter,
    adminSmallUpdateRateLimiter,
} from "@/middleware/rateLimiter.js";
import { getFeedbacks, GetFeedbacksQuerySchema, GetFeedbacksResponseSchema } from "../feedbacks/get.js";
import { updateFeedbackStatus, UpdateFeedbackStatusParamsSchema, UpdateFeedbackStatusBodySchema, UpdateFeedbackStatusResponseSchema } from "../feedbacks/[id]/patch.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/responseError.js";

const router = Router();

// ============================================================================
// Admin Feedbacks Routes
// ============================================================================
router.get(
    "",
    verifyFirebaseTokenAdmin as any,
    adminGetSmallContentRateLimiter,
    getFeedbacks as any
);
router.patch(
    "/:id",
    verifyFirebaseTokenAdmin as any,
    adminSmallUpdateRateLimiter,
    updateFeedbackStatus as any
);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex-admin/feedbacks",
    summary: "Get all feedbacks",
    tag: "Admin Feedbacks",
    query: GetFeedbacksQuerySchema,
    responses: {
        200: {
            description: "Feedbacks retrieved successfully",
            schema: getResponseSuccessSchema(GetFeedbacksResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.PATCH,
    path: "/komplex-admin/feedbacks/:id",
    summary: "Update feedback status",
    tag: "Admin Feedbacks",
    body: UpdateFeedbackStatusBodySchema,
    responses: {
        200: {
            description: "Feedback status updated successfully",
            schema: getResponseSuccessSchema(UpdateFeedbackStatusResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

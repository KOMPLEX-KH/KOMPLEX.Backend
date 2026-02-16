import Router from "express";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import { adminGetBigContentRateLimiter } from "@/middleware/rateLimiter.js";
import { getAiDashboard as getAdminAiDashboard, AiDashboardResponseSchema } from "../ai/dashboard/get.js";
import { getGeneralAiDashboard as getAdminGeneralAiDashboard, GeneralAiDashboardResponseSchema } from "../ai/general/dashboard/get.js";
import { getGeneralAiResponses as getAdminGeneralAiResponses, GeneralAiResponsesResponseSchema } from "../ai/general/get.js";
import { getGeneralAiResponseById as getAdminGeneralAiResponseById, GeneralAiResponseByIdResponseSchema } from "../ai/general/responses/[id]/get.js";
import { getTopicAiDashboard as getAdminTopicAiDashboard, TopicAiDashboardResponseSchema } from "../ai/topics/dashboard/get.js";
import { getTopicAiResponses as getAdminTopicAiResponses, TopicAiResponsesResponseSchema } from "../ai/topics/get.js";
import { getTopicAiResponseById as getAdminTopicAiResponseById, TopicAiResponseByIdResponseSchema } from "../ai/topics/responses/[id]/get.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";

const router = Router();

// ============================================================================
// Admin AI Routes
// ============================================================================
router.get("/dashboard", verifyFirebaseTokenAdmin as any, adminGetBigContentRateLimiter, getAdminAiDashboard as any);
router.get(
    "/general/dashboard",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAdminGeneralAiDashboard as any
);
router.get(
    "/general",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAdminGeneralAiResponses as any
);
router.get(
    "/general/responses/:id",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAdminGeneralAiResponseById as any
);
router.get(
    "/topics/dashboard",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAdminTopicAiDashboard as any
);
router.get(
    "/topics",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAdminTopicAiResponses as any
);
router.get(
    "/topics/responses/:id",
    verifyFirebaseTokenAdmin as any,
    adminGetBigContentRateLimiter,
    getAdminTopicAiResponseById as any
);

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.GET,
    path: "/komplex-admin/ai/dashboard",
    summary: "Get AI dashboard",
    tag: "Admin AI",
    responses: {
        200: {
            description: "AI dashboard retrieved successfully",
            schema: getResponseSuccessSchema(AiDashboardResponseSchema),
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
    path: "/komplex-admin/ai/general/dashboard",
    summary: "Get general AI dashboard",
    tag: "Admin AI",
    responses: {
        200: {
            description: "General AI dashboard retrieved successfully",
            schema: getResponseSuccessSchema(GeneralAiDashboardResponseSchema),
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
    path: "/komplex-admin/ai/general",
    summary: "Get all general AI responses",
    tag: "Admin AI",
    responses: {
        200: {
            description: "General AI responses retrieved successfully",
            schema: getResponseSuccessSchema(GeneralAiResponsesResponseSchema),
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
    path: "/komplex-admin/ai/general/responses/:id",
    summary: "Get general AI response by ID",
    tag: "Admin AI",
    responses: {
        200: {
            description: "General AI response retrieved successfully",
            schema: getResponseSuccessSchema(GeneralAiResponseByIdResponseSchema),
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
    path: "/komplex-admin/ai/topics/dashboard",
    summary: "Get topic AI dashboard",
    tag: "Admin AI",
    responses: {
        200: {
            description: "Topic AI dashboard retrieved successfully",
            schema: getResponseSuccessSchema(TopicAiDashboardResponseSchema),
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
    path: "/komplex-admin/ai/topics",
    summary: "Get all topic AI responses",
    tag: "Admin AI",
    responses: {
        200: {
            description: "Topic AI responses retrieved successfully",
            schema: getResponseSuccessSchema(TopicAiResponsesResponseSchema),
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
    path: "/komplex-admin/ai/topics/responses/:id",
    summary: "Get topic AI response by ID",
    tag: "Admin AI",
    responses: {
        200: {
            description: "Topic AI response retrieved successfully",
            schema: getResponseSuccessSchema(TopicAiResponseByIdResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

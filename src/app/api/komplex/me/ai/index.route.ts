import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import { aiRateLimiter } from "@/middleware/rateLimiter.js";
import { getAllAiGeneralTabs, MeAiGeneralTabsQuerySchema, MeAiGeneralTabItemSchema } from "../../me/ai/general/tabs/get.js";
import { createAiGeneralTab, MeCreateAiGeneralTabBodySchema, MeCreateAiGeneralTabResponseSchema } from "../../me/ai/general/tabs/post.js";
import { getAiGeneralTabHistory, MeAiGeneralTabHistoryParamsSchema, MeAiGeneralTabHistoryQuerySchema, MeAiGeneralTabHistoryItemSchema } from "../../me/ai/general/tabs/[id]/get.js";
import { postAiGeneral, MePostAiGeneralParamsSchema, MePostAiGeneralBodySchema, MePostAiGeneralResponseSchema } from "../../me/ai/general/tabs/[id]/post.js";
import { updateAiGeneralTab, MeUpdateAiGeneralTabParamsSchema, MeUpdateAiGeneralTabBodySchema, MeUpdateAiGeneralTabResponseSchema } from "../../me/ai/general/tabs/[id]/put.js";
import { deleteAiGeneralTab, MeDeleteAiGeneralTabParamsSchema, MeDeleteAiGeneralTabResponseSchema } from "../../me/ai/general/tabs/[id]/delete.js";
import { rateAiGeneralResponse, MeRateAiGeneralParamsSchema, MeRateAiGeneralBodySchema } from "../../me/ai/general/rating/[id]/post.js";
import { getAllAiTopics, MeAiTopicItemSchema } from "../../me/ai/topics/get.js";
import { getAiTopicHistory, MeAiTopicHistoryParamsSchema, MeAiTopicHistoryQuerySchema, MeAiTopicHistoryItemSchema } from "../../me/ai/topics/[id]/get.js";
import { callAiTopic, MeCallAiTopicParamsSchema, MeCallAiTopicBodySchema, MeCallAiTopicResponseSchema } from "../../me/ai/topics/[id]/post.js";
import { deleteAiTopic, MeDeleteAiTopicParamsSchema, MeDeleteAiTopicResponseSchema } from "../../me/ai/topics/[id]/delete.js";
import { rateAiTopicResponse, MeRateAiTopicParamsSchema, MeRateAiTopicBodySchema } from "../../me/ai/topics/rating/[id]/post.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

const router = Router();

// ============================================================================
// Me AI Routes
// ============================================================================
router.get("/general/tabs", verifyFirebaseToken as any, aiRateLimiter, getAllAiGeneralTabs as any);
router.post("/general/tabs", verifyFirebaseToken as any, aiRateLimiter, createAiGeneralTab as any);
router.get(
    "/general/tabs/:id",
    verifyFirebaseToken as any,
    aiRateLimiter,
    getAiGeneralTabHistory as any
);
router.post("/general/tabs/:id", verifyFirebaseToken as any, aiRateLimiter, postAiGeneral as any);
router.put(
    "/general/tabs/:id",
    verifyFirebaseToken as any,
    aiRateLimiter,
    updateAiGeneralTab as any
);
router.delete(
    "/general/tabs/:id",
    verifyFirebaseToken as any,
    aiRateLimiter,
    deleteAiGeneralTab as any
);
router.post(
    "/general/rating/:id",
    verifyFirebaseToken as any,
    aiRateLimiter,
    rateAiGeneralResponse as any
);
router.get("/topics", verifyFirebaseToken as any, aiRateLimiter, getAllAiTopics as any);
router.get("/topics/:id", verifyFirebaseToken as any, aiRateLimiter, getAiTopicHistory as any);
router.post("/topics/:id", verifyFirebaseToken as any, aiRateLimiter, callAiTopic as any);
router.delete("/topics/:id", verifyFirebaseToken as any, aiRateLimiter, deleteAiTopic as any);
router.post("/topics/rating/:id", verifyFirebaseToken as any, aiRateLimiter, rateAiTopicResponse as any);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/me/ai/general/tabs",
    summary: "Get all AI general tabs",
    tag: "Me",
    query: MeAiGeneralTabsQuerySchema,
    responses: {
        200: {
            description: "AI general tabs retrieved successfully",
            schema: getResponseSuccessSchema(MeAiGeneralTabItemSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/me/ai/general/tabs",
    summary: "Create a new AI general tab",
    tag: "Me",
    body: MeCreateAiGeneralTabBodySchema,
    responses: {
        201: {
            description: "AI general tab created successfully",
            schema: getResponseSuccessSchema(MeCreateAiGeneralTabResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/me/ai/general/tabs/:id",
    summary: "Get AI general tab history",
    tag: "Me",
    query: MeAiGeneralTabHistoryQuerySchema,
    responses: {
        200: {
            description: "AI general tab history retrieved successfully",
            schema: getResponseSuccessSchema(MeAiGeneralTabHistoryItemSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/me/ai/general/tabs/:id",
    summary: "Post to AI general tab",
    tag: "Me",
    body: MePostAiGeneralBodySchema,
    responses: {
        200: {
            description: "AI general response posted successfully",
            schema: getResponseSuccessSchema(MePostAiGeneralResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.PUT,
    path: "/komplex/me/ai/general/tabs/:id",
    summary: "Update AI general tab",
    tag: "Me",
    body: MeUpdateAiGeneralTabBodySchema,
    responses: {
        200: {
            description: "AI general tab updated successfully",
            schema: getResponseSuccessSchema(MeUpdateAiGeneralTabResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.DELETE,
    path: "/komplex/me/ai/general/tabs/:id",
    summary: "Delete AI general tab",
    tag: "Me",
    responses: {
        200: {
            description: "AI general tab deleted successfully",
            schema: getResponseSuccessSchema(MeDeleteAiGeneralTabResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/me/ai/general/rating/:id",
    summary: "Rate AI general response",
    tag: "Me",
    body: MeRateAiGeneralBodySchema,
    responses: {
        200: {
            description: "AI general response rated successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/me/ai/topics",
    summary: "Get all AI topics",
    tag: "Me",
    responses: {
        200: {
            description: "AI topics retrieved successfully",
            schema: getResponseSuccessSchema(MeAiTopicItemSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/me/ai/topics/:id",
    summary: "Get AI topic history",
    tag: "Me",
    query: MeAiTopicHistoryQuerySchema,
    responses: {
        200: {
            description: "AI topic history retrieved successfully",
            schema: getResponseSuccessSchema(MeAiTopicHistoryItemSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/me/ai/topics/:id",
    summary: "Call AI topic",
    tag: "Me",
    body: MeCallAiTopicBodySchema,
    responses: {
        200: {
            description: "AI topic response generated successfully",
            schema: getResponseSuccessSchema(MeCallAiTopicResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.DELETE,
    path: "/komplex/me/ai/topics/:id",
    summary: "Delete AI topic",
    tag: "Me",
    responses: {
        200: {
            description: "AI topic deleted successfully",
            schema: getResponseSuccessSchema(MeDeleteAiTopicResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/me/ai/topics/rating/:id",
    summary: "Rate AI topic response",
    tag: "Me",
    body: MeRateAiTopicBodySchema,
    responses: {
        200: {
            description: "AI topic response rated successfully",
            schema: getResponseSuccessSchema(z.any()),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import { getMe, MeResponseSchema } from "../../me/get.js";
import { getMeProfile, MeProfileResponseSchema } from "../../me/profile/get.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";

const router = Router();

// ============================================================================
// Me Profile Routes
// ============================================================================
router.get("", verifyFirebaseToken as any, getMe as any);
router.get("/profile", verifyFirebaseToken as any, getMeProfile as any);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/me",
    summary: "Get current user",
    tag: "Me",
    responses: {
        200: {
            description: "User retrieved successfully",
            schema: getResponseSuccessSchema(MeResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/me/profile",
    summary: "Get current user profile",
    tag: "Me",
    responses: {
        200: {
            description: "User profile retrieved successfully",
            schema: getResponseSuccessSchema(MeProfileResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

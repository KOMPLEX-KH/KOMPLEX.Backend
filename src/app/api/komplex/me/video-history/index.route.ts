import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import { getMyVideoHistory, MeVideoHistoryResponseSchema } from "../../me/video-history/get.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/responseError.js";

const router = Router();

// ============================================================================
// Me Video History Routes
// ============================================================================
router.get("", verifyFirebaseToken as any, getMyVideoHistory as any);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/me/video-history",
    summary: "Get user video history",
    tag: "Me",
    responses: {
        200: {
            description: "Video history retrieved successfully",
            schema: getResponseSuccessSchema(MeVideoHistoryResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

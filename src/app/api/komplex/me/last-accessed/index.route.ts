import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import { getLastAccessed, MeLastAccessedResponseSchema } from "../../me/last-accessed/get.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/responseError.js";

const router = Router();

// ============================================================================
// Me Last Accessed Routes
// ============================================================================
router.get("", verifyFirebaseToken as any, getLastAccessed as any);

registerOpenApiRoute({
    method: HttpMethod.GET,
    path: "/komplex/me/last-accessed",
    summary: "Get last accessed content",
    tag: "Me",
    responses: {
        200: {
            description: "Last accessed content retrieved successfully",
            schema: getResponseSuccessSchema(MeLastAccessedResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

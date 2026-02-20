import Router from "express";
import { verifyFirebaseToken, verifyFirebaseTokenAdmin } from "@/middleware/auth.js";
import { postVideoRateLimiter } from "@/middleware/rateLimiter.js";
import { postUploadUrl, UploadUrlResponseSchema, UploadUrlBodySchema } from "../upload-url/post.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";

const router = Router();

// ============================================================================
// Upload Routes
// ============================================================================
router.post(
    "/upload-url",
    verifyFirebaseToken as any,
    postVideoRateLimiter,
    postUploadUrl as any
);

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/upload-url",
    summary: "Upload URL",
    tag: "Upload",
    body: UploadUrlBodySchema,
    responses: {
        200: {
            description: "Upload URL",
            schema: getResponseSuccessSchema(UploadUrlResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

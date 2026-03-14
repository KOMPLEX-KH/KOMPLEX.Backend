import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import { postVideoRateLimiter } from "@/middleware/rateLimiter.js";
import { postUploadUrl, UploadUrlResponseSchema, UploadUrlBodySchema } from "./upload-url/post.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";
import { postUploadProfile, UploadProfileBodySchema, UploadProfileResponseSchema } from "./upload-profile/post.js";

const router = Router();

// ============================================================================
// Upload Routes
// ============================================================================
router.post(
    "/upload-url",
    // middleware becuase usage here is for logged in users to post forums or videos 
    verifyFirebaseToken as any,
    postVideoRateLimiter,
    postUploadUrl as any
);

router.post(
    "/upload-profile",
    // the route itself is secure, since it's a presigned url hence no middleware
    postVideoRateLimiter,
    postUploadProfile as any
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

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/upload-profile",
    summary: "Upload Profile",
    tag: "Upload",
    body: UploadProfileBodySchema,
    responses: {
        200: {
            description: "Upload Profile",
            schema: getResponseSuccessSchema(UploadProfileResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

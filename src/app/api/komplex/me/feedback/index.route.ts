import Router from "express";
import { verifyFirebaseToken } from "@/middleware/auth.js";
import { postSmallRateLimiter } from "@/middleware/rateLimiter.js";
import { postFeedback, MePostFeedbackBodySchema, MePostFeedbackResponseSchema } from "../../me/feedback/post.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/responseError.js";

const router = Router();

// ============================================================================
// Me Feedback Routes
// ============================================================================
router.post("", verifyFirebaseToken as any, postSmallRateLimiter, postFeedback as any);

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/me/feedback",
    summary: "Post feedback",
    tag: "Me",
    body: MePostFeedbackBodySchema,
    responses: {
        201: {
            description: "Feedback posted successfully",
            schema: getResponseSuccessSchema(MePostFeedbackResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

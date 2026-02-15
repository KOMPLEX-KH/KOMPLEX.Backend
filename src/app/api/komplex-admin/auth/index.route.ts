import Router from "express";
import { login } from "../auth/login/post.js";
import { registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { HttpMethod } from "@/utils/registerOpenapiRoute.js";
import { getResponseSuccessSchema } from "@/utils/response.js";
import { getResponseErrorSchema } from "@/utils/response.js";
import { LoginBodySchema, LoginResponseSchema } from "../auth/login/post.js";
import { adminLoginRateLimiter } from "@/middleware/rateLimiter.js";
import { verifyFirebaseTokenAdmin } from "@/middleware/auth.js";

const router = Router();

// ============================================================================
// Admin Authentication Routes
// ============================================================================
router.post("/login", adminLoginRateLimiter, login as any);

registerOpenApiRoute({
    isAdminApi: true,
    method: HttpMethod.POST,
    path: "/komplex-admin/auth/login",
    summary: "Login",
    tag: "Auth",
    body: LoginBodySchema,
    responses: {
        200: {
            description: "Login successful",
            schema: getResponseSuccessSchema(LoginResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;

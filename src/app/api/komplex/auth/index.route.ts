import { SocialLoginBodySchema, SocialLoginResponseSchema } from "./social-login/post.js";
import Router from "express";
import { userLoginRateLimiter, userSignupRateLimiter } from "@/middleware/rateLimiter.js";
import { postSignup, SignupBodySchema, SignupResponseSchema } from "../auth/signup/post.js";
import { postSocialLogIn } from "../auth/social-login/post.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/responseError.js";

const router = Router();

// ============================================================================
// Authentication Routes
// ============================================================================
router.post("/signup", userSignupRateLimiter, postSignup as any);

router.post("/social-login", userLoginRateLimiter, postSocialLogIn as any);

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/auth/signup",
    summary: "Signup",
    tag: "Auth",
    body: SignupBodySchema,
    responses: {
        200: {
            description: "User signed up successfully",
            schema: getResponseSuccessSchema(SignupResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/auth/social-login",
    summary: "Social login",
    tag: "Auth",
    body: SocialLoginBodySchema,
    responses: {
        200: {
            description: "User logged in successfully",
            schema: getResponseSuccessSchema(SocialLoginResponseSchema),
        },
        400: {
            description: "Invalid input",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;


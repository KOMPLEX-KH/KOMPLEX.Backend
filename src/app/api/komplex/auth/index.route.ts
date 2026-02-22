import { SocialLoginBodySchema, SocialLoginResponseSchema } from "./social-login/post.js";
import Router from "express";
import { userLoginRateLimiter, userSignupRateLimiter, userResetPasswordRateLimiter, userSendOtpRateLimiter } from "@/middleware/rateLimiter.js";
import { postSignup, SignupBodySchema, SignupResponseSchema } from "../auth/signup/post.js";
import { postSocialLogIn } from "../auth/social-login/post.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";
import { getResponseErrorSchema, getResponseSuccessSchema } from "@/utils/response.js";
import { postSendSignupOtp, SendOtpBodySchema, SendOtpResponseSchema } from "./send-signup-otp/post.js";
import { postVerifySignupOtp, VerifySignupOtpBodySchema, VerifySignupOtpResponseSchema } from "./verify-signup-otp/post.js";
import { postSendForgetPwOtp, SendForgetPwOtpBodySchema, SendForgetPwOtpResponseSchema } from "./send-forget-pw-otp/post.js";
import { postVerifyOtp, VerifyOtpBodySchema, VerifyOtpResponseSchema } from "./verify-forget-pw-otp/post.js";
import { postResetPassword, ResetPasswordBodySchema, ResetPasswordResponseSchema } from "./reset-password/post.js";

const router = Router();

// ============================================================================
// New 3-Step Authentication Routes 
// ============================================================================
router.post("/send-signup-otp", userSendOtpRateLimiter, postSendSignupOtp as any);

router.post("/verify-signup-otp", postVerifySignupOtp as any);

router.post("/signup", userSignupRateLimiter, postSignup as any);

// ============================================================================
// Other Authentication Routes
// ============================================================================

router.post("/social-login", userLoginRateLimiter, postSocialLogIn as any);

// Password Reset Routes
router.post("/send-forget-pw-otp", userSendOtpRateLimiter, postSendForgetPwOtp as any);

router.post("/verify-forget-pw-otp", postVerifyOtp as any);

router.post("/reset-password", userResetPasswordRateLimiter, postResetPassword as any);

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/auth/signup",
    summary: "Create user account with verified email",
    tag: "Auth",
    body: SignupBodySchema,
    responses: {
        200: {
            description: "User created successfully",
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
    path: "/komplex/auth/send-signup-otp",
    summary: "Send OTP for email verification",
    tag: "Auth",
    body: SendOtpBodySchema,
    responses: {
        200: {
            description: "Verification code sent successfully",
            schema: getResponseSuccessSchema(SendOtpResponseSchema),
        },
        400: {
            description: "User already exists or invalid email",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/auth/verify-signup-otp",
    summary: "Verify OTP and get verification token",
    tag: "Auth",
    body: VerifySignupOtpBodySchema,
    responses: {
        200: {
            description: "OTP verified, token provided for signup",
            schema: getResponseSuccessSchema(VerifySignupOtpResponseSchema),
        },
        400: {
            description: "Invalid OTP or expired",
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

// ============================================================================
// Password Reset OpenAPI Routes
// ============================================================================

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/auth/send-forget-pw-otp",
    summary: "Send OTP for password reset",
    tag: "Auth",
    body: SendForgetPwOtpBodySchema,
    responses: {
        200: {
            description: "Verification code sent successfully",
            schema: getResponseSuccessSchema(SendForgetPwOtpResponseSchema),
        },
        404: {
            description: "No account found with this email",
            schema: getResponseErrorSchema(),
        },
        400: {
            description: "OTP already sent or invalid email",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/auth/verify-forget-pw-otp",
    summary: "Verify OTP for password reset",
    tag: "Auth",
    body: VerifyOtpBodySchema,
    responses: {
        200: {
            description: "OTP verified, reset token provided",
            schema: getResponseSuccessSchema(VerifyOtpResponseSchema),
        },
        400: {
            description: "Invalid OTP or expired",
            schema: getResponseErrorSchema(),
        },
        429: {
            description: "Maximum attempts exceeded",
            schema: getResponseErrorSchema(),
        },
    },
});

registerOpenApiRoute({
    method: HttpMethod.POST,
    path: "/komplex/auth/reset-password",
    summary: "Reset password with reset token",
    tag: "Auth",
    body: ResetPasswordBodySchema,
    responses: {
        200: {
            description: "Password reset successfully",
            schema: getResponseSuccessSchema(ResetPasswordResponseSchema),
        },
        400: {
            description: "Invalid or expired reset token",
            schema: getResponseErrorSchema(),
        },
        404: {
            description: "User not found",
            schema: getResponseErrorSchema(),
        },
    },
});

export default router;


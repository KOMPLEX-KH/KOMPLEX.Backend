import { Request, Response } from "express";
import { db } from "@/db/drizzle/index.js";
import { users } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { sendResponseError, sendResponseSuccess, ResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";
import { eq } from "drizzle-orm";
import { EmailType, sendEmail } from "@/utils/emailService.js";

export const SendForgetPwOtpBodySchema = z
  .object({
    email: z.string().email(),
  })
  .openapi("SendForgetPwOtpBody");

export const SendForgetPwOtpResponseSchema = z
  .object({
    message: z.string(),
    expiresIn: z.number(),
  })
  .openapi("SendForgetPwOtpResponse");

export const postSendForgetPwOtp = async (req: Request, res: Response) => {
  try {

    const { email } = await SendForgetPwOtpBodySchema.parseAsync(req.body);

    // Check if user exist in database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      return sendResponseError(res, new ResponseError("No account found with this email", 404));
    }

    // Check if OTP already sent and still valid
    const existingOtp = await redis.get(`forget-pw-otp:${email}`);
    if (existingOtp) {
      return sendResponseError(res, new ResponseError("OTP already sent. Please check your email or wait for it to expire.", 400));
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Redis 5 minutes
    const otpData = {
      otp,
      email,
      attempts: 0,
      createdAt: Date.now(),
    };

    await redis.setEx(`forget-pw-otp:${email}`, 90, JSON.stringify(otpData)); // 1.5 minutes

    // Send OTP via Email for Password Reset
    await sendEmail(email, "KOMPLEX Password Reset", EmailType.ForgetPassword, otp);

    const responseBody = SendForgetPwOtpResponseSchema.parse({
      message: "Verification code sent to your email",
      expiresIn: 90,
    });

    return sendResponseSuccess(res, responseBody, "Verification code sent to your email");
  } catch (err) {
    return sendResponseError(res, err);
  }
};
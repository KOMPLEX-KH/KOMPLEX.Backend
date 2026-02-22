import { Request, Response } from "express";
import { db } from "@/db/drizzle/index.js";
import { users } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { getResponseError } from "@/utils/response.js";
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

export type SendForgetPwOtpBody = z.infer<typeof SendForgetPwOtpBodySchema>;

export const postSendForgetPwOtp = async (req: Request, res: Response) => {
  try {
    const { email }: SendForgetPwOtpBody = await SendForgetPwOtpBodySchema.parseAsync(req.body);
    
    // Check if user EXISTS in database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        message: "No account found with this email address"
      });
    }

    // Check if OTP already sent and still valid
    const existingOtp = await redis.get(`forget-pw-otp:${email}`);
    if (existingOtp) {
      return res.status(400).json({
        message: "OTP already sent. Please check your email or wait for it to expire."
      });
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

    await redis.setEx(`forget-pw-otp:${email}`, 300, JSON.stringify(otpData)); // 5 minutes

    // Send OTP via Email for Password Reset
    await sendEmail(email, "KOMPLEX Password Reset", EmailType.ForgetPassword, otp);

    return res.status(200).json({
      message: "Verification code sent to your email",
      expiresIn: 300,
    });
  } catch (err) {
    return getResponseError(res, err);
  }
};
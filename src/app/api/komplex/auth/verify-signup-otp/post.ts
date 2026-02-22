import { Request, Response } from "express";
import { db } from "@/db/drizzle/index.js";
import { users } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { getResponseError, getResponseSuccess } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

export const VerifySignupOtpBodySchema = z
  .object({
    email: z.string().email(),
    otp: z.string().length(6),
  })
  .openapi("VerifySignupOtpBody");

export const VerifySignupOtpResponseSchema = z
  .object({
    message: z.string(),
    verificationToken: z.string(), // Token to use in signup step
    expiresIn: z.number(), // Time before token expires
    attemptsLeft: z.number().optional(),
  })
  .openapi("VerifySignupOtpResponse");

export type VerifySignupOtpBody = z.infer<typeof VerifySignupOtpBodySchema>;

export const postVerifySignupOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp }: VerifySignupOtpBody = await VerifySignupOtpBodySchema.parseAsync(req.body);
    
    //Get OTP data from Redis (changed key to match send-signup-otp)
    const otpKey = `signup-otp:${email}`;
    const storedOtpData = await redis.get(otpKey);

    if (!storedOtpData) {
      return res.status(400).json({
        message: "Verification code has expired or does not exist. Please request a new one.",
      });
    }

    // Parse stored OTP data (only OTP info, no user data)
    const otpData = JSON.parse(storedOtpData);
    const { otp: storedOtp, attempts } = otpData;

    //Check attempt limits
    if (attempts >= 3) {
      await redis.del(otpKey);
      return res.status(429).json({
        message: "Maximum verification attempts exceeded. Please request a new OTP.",
      });
    }

    // verify otp
    if (otp !== storedOtp) {
      const newAttempts = attempts + 1;
      const updatedOtpData = { ...otpData, attempts: newAttempts };
      
      // Keep same expiry time
      const ttl = await redis.ttl(otpKey);
      if (ttl > 0) {
        await redis.setEx(otpKey, ttl, JSON.stringify(updatedOtpData));
      }

      return res.status(400).json({
        message: "Invalid verification code. Please try again.",
        attemptsLeft: 3 - newAttempts,
      });
    }

    // OTP VERIFIED - Generate verification token for signup
    const verificationToken = `verified:${email}:${Date.now()}`;
    
    // Store verification token (15 minutes) - user can now signup
    await redis.setEx(`verified-email:${email}`, 900, verificationToken);
    
    // Remove OTP data
    await redis.del(otpKey);

    // Return success - no user creation here
    return res.status(200).json({
      message: "Email verified successfully. You can now complete your signup.",
      verificationToken,
      expiresIn: 900, // 15 minutes to complete signup
    });

  } catch (error) {
    return getResponseError(res, error);
  }
};
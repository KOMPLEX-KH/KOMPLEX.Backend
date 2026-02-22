import { Request } from "express";
import { Response } from "express";
import { db } from "@/db/drizzle/index.js";
import { users } from "@/db/drizzle/schema.js";
import { getResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";
import { redis } from "@/db/redis/redis.js";
import { randomUUID } from "crypto";

export const VerifyOtpBodySchema = z
    .object({
        email: z.string().email(),
        otp: z.string().length(6),
    })
    .openapi("VerifyOtpBody");

export const VerifyOtpResponseSchema = z
  .object({
    message: z.string(),
    resetToken: z.string().optional(), // only return when OTP is verified successfully
    attemptsLeft: z.number().optional(),
  })
  .openapi("VerifyOtpResponse");

export type VerifyOtpBody = z.infer<typeof VerifyOtpBodySchema>;

export const postVerifyOtp = async (req: Request, res: Response) => {
  try{
    
    const { email, otp }: VerifyOtpBody = await VerifyOtpBodySchema.parseAsync(req.body);
    
    //Get OTP from Redis
    const otpKey = `forget-pw-otp:${email}`;
    const storedOtpData = await redis.get(otpKey);

    if (!storedOtpData) {
      return res.status(400).json({
        message: "OTP has expired or does not exist. Please request a new one.",
      });
    }

    // convert string to object
    const { otp: storedOtp, attempts } = JSON.parse(storedOtpData);

    // check if otp over 3 attempts
    if(attempts >=3){
      await redis.del(otpKey);
      return res.status(429).json({
        message: "Maximum attempts exceeded",
      });
    }

    // wrong otp
    if(otp !== storedOtp){
      const newAttempts = attempts + 1;

      // update attempts in redis
      const updatedOtpData = { ...JSON.parse(storedOtpData), attempts: newAttempts };

      // keep the same expired time
      const ttl = await redis.ttl(otpKey);
      if (ttl > 0) {
        await redis.setEx(otpKey, ttl, JSON.stringify(updatedOtpData));
      }

      return res.status(400).json({
        message: "Invalid OTP. Please try again.",
        attemptsLeft: 3 - newAttempts,
      });
    }

    const resetToken = randomUUID();

    await redis.setEx(`resetToken:${email}`, 900, resetToken); // 15 minutes
    await redis.del(otpKey);

    return res.status(200).json({
      message: "OTP verified successfully",
      resetToken,
    });

  }catch(error){
    return getResponseError(res, error);
  }
}
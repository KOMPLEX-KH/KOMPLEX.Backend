import { Request } from "express";
import { Response } from "express";
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
    expiresIn: z.number().optional(), // seconds until resetToken expires
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
    const { otp: storedOtp } = JSON.parse(storedOtpData);

    // wrong otp
    if (otp !== storedOtp) {
      return res.status(400).json({
        message: "Invalid OTP. Please try again.",
      });
    }
    
    // generate reset token
    const resetToken = randomUUID();

    await redis.setEx(`resetToken:${email}`, 300, resetToken); // 5 minutes
    await redis.del(otpKey);

    return res.status(200).json({
      message: "OTP verified successfully",
      resetToken,
      expiresIn: 300, // 5 minutes
    });

  }catch(error){
    return getResponseError(res, error);
  }
}
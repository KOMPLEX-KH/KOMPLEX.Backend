import { Request } from "express";
import { Response } from "express";
import { sendResponseError, sendResponseSuccess, ResponseError } from "@/utils/response.js";
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

export const postVerifyOtp = async (req: Request, res: Response) => {
  try {

    const { email, otp } = await VerifyOtpBodySchema.parseAsync(req.body);

    //Get OTP from Redis
    const otpKey = `forget-pw-otp:${email}`;
    const storedOtpData = await redis.get(otpKey);

    if (!storedOtpData) {
      return sendResponseError(res, new ResponseError("OTP has expired or does not exist. Please request a new one.", 400));
    }

    // convert string to object
    const { otp: storedOtp } = JSON.parse(storedOtpData);

    // wrong otp
    if (otp !== storedOtp) {
      return sendResponseError(res, new ResponseError("Invalid OTP. Please try again.", 400));
    }

    // generate reset token
    const resetToken = randomUUID();

    await redis.setEx(`resetToken:${email}`, 300, resetToken); // 5 minutes
    await redis.del(otpKey);

    const responseBody = VerifyOtpResponseSchema.parse({
      resetToken,
      expiresIn: 300, // 5 minutes,
    });

    return sendResponseSuccess(res, responseBody, "OTP verified successfully");

  } catch (error) {
    return sendResponseError(res, error);
  }
}
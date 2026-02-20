import { Request, Response } from "express";
import { db } from "@/db/drizzle/index.js";
import { users } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { EmailType, sendEmail } from "@/utils/emailService.js";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const SendOtpBodySchema = z
  .object({
    email: z.string().email(),
  })
  .openapi("SendOtpBody");

export const SendOtpResponseSchema = z
  .object({
    message: z.string(),
    expiresIn: z.number(),
  })
  .openapi("SendOtpResponse");

export type SendOtpBody = z.infer<typeof SendOtpBodySchema>;




// Handles the logic for sending OTP to user's email
export const postSendOtp = async (req: Request, res: Response) => {
    try{  
        const {email} : SendOtpBody = await SendOtpBodySchema.parseAsync(req.body);
        
        // check if user exists
        const user = await db
            .select()
            .from(users) 
            .where(eq(users.email, email))
            .limit(1);

        if(!user.length){
            return getResponseError(res, new ResponseError("No account found with this email address", 404));
        }
        
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store in Redis around 5 minutes
        const otpData = {
            otp,
            email,
            attemps: 0,
            createdAt: Date.now(),
        }

        await redis.setEx(`otp:${email}`, 300, JSON.stringify(otpData)); // 5 minutes
        
        //Send OTP via Gmail
        await sendEmail(email, "KOMPLEX Password Reset OTP", EmailType.ForgetPassword, otp);

        return res.status(200).json({
            message: "OTP sent to email",
            expiresIn: 300,
        });
    }catch(err){
        return getResponseError(res, err);
    }
}

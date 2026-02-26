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




// Handles the logic for sending OTP for SIGNUP (user must NOT exist)
export const postSendSignupOtp = async (req: Request, res: Response) => {
    try{  
        const {email} : SendOtpBody = await SendOtpBodySchema.parseAsync(req.body);
        
        // check if user ALREADY exists (opposite of password reset)
        const user = await db
            .select()
            .from(users) 
            .where(eq(users.email, email))
            .limit(1);

        if(user.length > 0){
            return getResponseError(res, new ResponseError("User already exists with this email address", 400));
        }
        
        // Check if OTP already sent and still valid
        const existingOtp = await redis.get(`signup-otp:${email}`);
        if(existingOtp){
            return res.status(400).json({
                message: "OTP already sent. Please check your email or wait for it to expire."
            });
        }
        
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store in Redis (5 minutes) - only email + OTP for signup
        const otpData = {
            otp,
            email,
            attempts: 0,
            createdAt: Date.now(),
        }

        await redis.setEx(`signup-otp:${email}`, 90, JSON.stringify(otpData)); // 1.5 minutes
        
        //Send OTP via Email for Signup
        await sendEmail(email, "KOMPLEX Account Verification", EmailType.Signup, otp);

        return res.status(200).json({
            message: "Verification code sent to your email",
            expiresIn: 90,
        });
    }catch(err){
        return getResponseError(res, err);
    }
}

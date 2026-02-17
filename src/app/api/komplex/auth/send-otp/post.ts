import { Request, Response } from "express";
import { db } from "@/db/drizzle/index.js";
import { users } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { getResponseError } from "@/utils/response.js";
import { sendOtpEmail } from "@/utils/emailService.js";
import { z } from "@/config/openapi/openapi.js";
import { eq } from "drizzle-orm";
import { id } from "zod/v4/locales";

export const SendOtpBodySchema = z
  .object({
    email: z.string().email("Invalid email format"),
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
    const {email} : SendOtpBody = await SendOtpBodySchema.parseAsync(req.body);

    try{
        // check if user exists
        const user = await db
            .select({id: users.id, email: users.email})
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if(!user.length){
            return res.status(404).json({ 
                message: "No account found with this email address" 
            });
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

        await redis.setex(`otp:${email}`, 300, JSON.stringify(otpData)); // 5 minutes
        
        //Send OTP via Gmail
        await sendOtpEmail(email, otp);

        return res.status(200).json({
            message: "OTP sent to email",
            expiresIn: 300, // 5 minutes
        });
    }catch(err){
        return getResponseError(res, err);
    }
}
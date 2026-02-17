import { Request, Response } from "express";
import { db } from "@/db/drizzle/index.js";
import { users } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { getResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export const ResetPasswordBodySchema = z
    .object({
        email: z.string().email("Invalid email format"),
        resetToken: z.string("Reset token is required"),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
    })
    .openapi("ResetPasswordBody");

export const ResetPasswordResponseSchema = z
    .object({
        message: z.string(),
    })
    .openapi("ResetPasswordResponse");

export type ResetPasswordBody = z.infer<typeof ResetPasswordBodySchema>;

export const postResetPassword = async (req: Request, res: Response) => {
    const { email, resetToken, newPassword }: ResetPasswordBody = 
        await ResetPasswordBodySchema.parseAsync(req.body);
    
    try{
        // verify reset token from redis
        const storedToken = await redis.get(`resetToken:${email}`);

        if(!storedToken || storedToken !== resetToken){
            return res.status(400).json({ 
                message: "Invalid or expired reset token" 
            });
        }
        
        // hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12); 
        
        // update password in database
        const updatedUser = await db
            .update(users)
            .set({ 
              password: hashedPassword,
              updatedAt: new Date()
            })
            .where(eq(users.email, email))
            .returning({ id: users.id });
        
        if (!updatedUser.length) {
            return res.status(404).json({ message: "User not found" });
        }

        //reset token
        await redis.del(`reset-token:${email}`);

        return res.status(200).json({
            message: "Password reset successfully.",
        });

    }catch(err){
        return getResponseError(res, err);
    }
}
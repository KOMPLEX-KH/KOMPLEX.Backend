import { Request, Response } from "express";
import { db } from "@/db/drizzle/index.js";
import { users } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { getResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";
import { eq } from "drizzle-orm";
import admin from "@/config/firebase/admin.js";

export const ResetPasswordBodySchema = z
    .object({
        email: z.string().email(),
        resetToken: z.string(),
        newPassword: z.string().min(6),
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
        
        // get user by email to find firebase uid
        const [user] = await db
            .select({uid: users.uid})
            .from(users)
            .where(eq(users.email, email));
        
        if (!user || !user.uid) {
            return res.status(404).json({ message: "User not found" });
        }

        // update password in firebase
        await admin.auth().updateUser(user.uid, {
            password: newPassword,
        });

        //reset token
        await redis.del(`resetToken:${email}`);

        return res.status(200).json({
            message: "Password reset successfully.",
        });

    }catch(err){
        return getResponseError(res, err);
    }
}
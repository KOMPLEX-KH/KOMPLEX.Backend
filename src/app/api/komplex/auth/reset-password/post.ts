import { Request, Response } from "express";
import { db } from "@/db/drizzle/index.js";
import { users } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { getResponseError, getResponseSuccess, ResponseError } from "@/utils/response.js";
import { eq } from "drizzle-orm";
import admin from "@/config/firebase/admin.js";
import { z } from "@/config/openapi/openapi.js";

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


export const postResetPassword = async (req: Request, res: Response) => {
    const { email, resetToken, newPassword } =
        await ResetPasswordBodySchema.parseAsync(req.body);

    try {
        // get reset token from redis
        const storedToken = await redis.get(`resetToken:${email}`);

        // compare token
        if (!storedToken || storedToken !== resetToken) {
            return getResponseError(res, new ResponseError("Invalid or expired reset token", 400));
        }

        // get user by email to find firebase uid
        const [user] = await db
            .select({ uid: users.uid })
            .from(users)
            .where(eq(users.email, email));

        if (!user || !user.uid) {
            return getResponseError(res, new ResponseError("User not found", 404));
        }

        // update password in firebase
        await admin.auth().updateUser(user.uid, {
            password: newPassword,
        });

        //reset token
        await redis.del(`resetToken:${email}`);

        const responseBody = ResetPasswordResponseSchema.parse({
            message: "Password reset successfully.",
        });

        return getResponseSuccess(res, responseBody, "Password reset successfully.");

    } catch (err) {
        return getResponseError(res, err);
    }
}
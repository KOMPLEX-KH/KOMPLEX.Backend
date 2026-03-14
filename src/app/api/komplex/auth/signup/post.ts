import { Request } from "express";
import { Response } from "express";
import { db } from "@/db/drizzle/index.js";
import { users } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { sendResponseError, sendResponseSuccess, ResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";
import { eq } from "drizzle-orm";

// Validates incoming request data (now includes verificationToken)
export const SignupBodySchema = z
  .object({
    email: z.string().email(),
    username: z.string(),
    uid: z.string(),
    firstName: z.string(),
    lastName: z.string().nullable().optional(),
    dateOfBirth: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    profileImageKey: z.string().optional(),
    verificationToken: z.string(), // Required from verify-otp step
  })
  .openapi("SignupBody");


// Response schema - returns created user
export const SignupResponseSchema = z.object({
  message: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string(),
    username: z.string(),
    firstName: z.string(),
    lastName: z.string().nullable(),
    uid: z.string(),
  }),
}).openapi("SignupResponse");

export const postSignup = async (req: Request, res: Response) => {
  try {
    const signupData = await SignupBodySchema.parseAsync(req.body);
    const { email, verificationToken } = signupData;

    // Check if email was verified (verificationToken required)
    if (!verificationToken) {
      return sendResponseError(res, new ResponseError("Email verification required. Please verify your email first.", 400));
    }

    // Verify the verification token
    const storedToken = await redis.get(`verified-email:${email}`);
    if (!storedToken || storedToken !== verificationToken) {
      return sendResponseError(res, new ResponseError("Invalid or expired verification token. Please verify your email again.", 400));
    }

    // check if user already exists (double check)
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return sendResponseError(res, new ResponseError("User already exists.", 400));
    }

    // CREATE USER IN DATABASE
    const profileImage = signupData.profileImageKey && process.env.R2_PHOTO_PUBLIC_URL
      ? `${process.env.R2_PHOTO_PUBLIC_URL}/${signupData.profileImageKey}`
      : null;

    const newUserResult = await db
      .insert(users)
      .values({
        email: signupData.email,
        username: signupData.username,
        uid: signupData.uid,
        firstName: signupData.firstName,
        lastName: signupData.lastName || null,
        dateOfBirth: signupData.dateOfBirth || null,
        phone: signupData.phone || null,
        profileImage,
        profileImageKey: signupData.profileImageKey || null,
        isAdmin: false,
        isSocial: false,
        isVerified: true, // Already verified via OTP
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const newUser = Array.isArray(newUserResult) ? newUserResult[0] : newUserResult;

    try {
      // Clean up verification token
      await redis.del(`verified-email:${email}`);

      const responseBody = SignupResponseSchema.parse({
        message: "Account created successfully",
        user: newUser,
      });

      return sendResponseSuccess(res, responseBody, "Account created successfully");
    } catch (postInsertError) {
      // Rollback: delete the inserted user so the client can retry cleanly
      await db.delete(users).where(eq(users.id, newUser.id));
      throw postInsertError;
    }
  } catch (error) {
    return sendResponseError(res, error);
  }
};
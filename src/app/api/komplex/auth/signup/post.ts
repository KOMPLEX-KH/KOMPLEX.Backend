import { Request } from "express";
import { Response } from "express";
import { db } from "@/db/drizzle/index.js";
import { users } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { sendEmail, EmailType } from "@/utils/emailService.js";
import { getResponseError, getResponseSuccess } from "@/utils/response.js";
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
    dateOfBirth: z.string().optional(),
    phone: z.string().optional(),
    profileImageKey: z.string().optional(),
    verificationToken: z.string(), // Required from verify-otp step
  })
  .openapi("SignupBody"); 


// Response schema - returns created user
export const SignupResponseSchema = z.object({
  message: z.string(),
  user: z.object({
    id: z.string(),
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
      return res.status(400).json({
        message: "Email verification required. Please verify your email first."
      });
    }

    // Verify the verification token
    const storedToken = await redis.get(`verified-email:${email}`);
    if (!storedToken || storedToken !== verificationToken) {
      return res.status(400).json({
        message: "Invalid or expired verification token. Please verify your email again."
      });
    }

    // check if user already exists (double check)
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists." });
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

    // Clean up verification token
    await redis.del(`verified-email:${email}`);

    return res.status(201).json({
      message: "Account created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        uid: newUser.uid,
      },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
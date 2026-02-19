import { Request } from "express";
import { Response } from "express";
import { db } from "@/db/drizzle/index.js";
import { users } from "@/db/drizzle/schema.js";
import { getResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

export const SignupBodySchema = z
  .object({
    email: z.string().email(),
    username: z.string().min(3).max(20),
    uid: z.string(),
    firstName: z.string().min(3).max(20),
    lastName: z.string().min(3).max(20),
    dateOfBirth: z.string().optional(),
    phone: z.string().optional(),
    profileImageKey: z.string().optional(),
  })
  .openapi("SignupBody");

export const SignupResponseSchema = z
  .object({
    id: z.number(),
    uid: z.string(),
    username: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    dateOfBirth: z.string().nullable().optional(),
    isAdmin: z.boolean(),
    isVerified: z.boolean(),
    isSocial: z.boolean(),
    email: z.string().email(),
    phone: z.string().nullable().optional(),
    profileImage: z.string().nullable().optional(),
    profileImageKey: z.string().nullable().optional(),
    lastTopicId: z.number().nullable().optional(),
    lastVideoId: z.number().nullable().optional(),
    lastAiTabId: z.number().nullable().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .openapi("SignupResponse");

export const postSignup = async (req: Request, res: Response) => {
  const {
    email,
    username,
    uid,
    firstName,
    lastName,
    dateOfBirth,
    phone,
    profileImageKey,
  } = await SignupBodySchema.parseAsync(req.body);

  try {
    const profileImage =
      profileImageKey && process.env.R2_PHOTO_PUBLIC_URL
        ? `${process.env.R2_PHOTO_PUBLIC_URL}/${profileImageKey}`
        : null;

    const user = await db
      .insert(users)
      .values({
        email,
        username,
        uid,
        firstName,
        lastName,
        // TODO: wire real dateOfBirth / phone once model supports it
        dateOfBirth: dateOfBirth ?? null,
        isAdmin: false,
        isSocial: false,
        isVerified: false,
        phone: phone ?? null,
        profileImage,
        profileImageKey: profileImageKey ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return res.status(200).json(user);
  } catch (error) {
    return getResponseError(res, error);
  }
};

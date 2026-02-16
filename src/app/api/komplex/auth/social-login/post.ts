import { getResponseError, ResponseError } from "@/utils/response.js";
import { Request } from "express";
import { Response } from "express";
import { db } from "@/db/drizzle/index.js";
import { users } from "@/db/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { userOauth } from "@/db/drizzle/models/user_oauth.js";
import { AuthenticatedRequest } from "@/types/request.js";
import { z } from "@/config/openapi/openapi.js";
import { HttpMethod, registerOpenApiRoute } from "@/utils/registerOpenapiRoute.js";

export const SocialLoginBodySchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  provider: z.string(),
  uid: z.string(),
  firstName: z.string().min(3).max(20),
  lastName: z.string().min(3).max(20),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  profileImage: z.string().optional(),
  profileImageKey: z.string().optional(),
}).openapi("SocialLoginBody");

export const SocialLoginResponseSchema = z.object({
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
}).openapi("SocialLoginResponse");

export type SocialLoginBody = z.infer<typeof SocialLoginBodySchema>;

export const postSocialLogIn = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const {
      email,
      username,
      provider,
      uid,
      firstName,
      lastName,
      dateOfBirth,
      phone,
      profileImage,
      profileImageKey,
    }: SocialLoginBody = await SocialLoginBodySchema.parseAsync(req.body);

    const isUserExists = await db
      .select()
      .from(users)
      .where(eq(users.uid, uid));
    if (isUserExists.length > 0) {
      return res.status(200).json(isUserExists[0]);
    }

    const user = await db
      .insert(users)
      .values({
        email,
        username,
        uid,
        firstName,
        lastName,
        dateOfBirth,
        isAdmin: false,
        isSocial: true,
        isVerified: false,
        phone,
        profileImage,
        profileImageKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await db.insert(userOauth).values({
      uid,
      provider,
      createdAt: new Date(),
    });
    return res.status(200).json(user);
  } catch (error) {
    return getResponseError(res, error);
  }
};


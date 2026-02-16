import { getResponseError, ResponseError } from "@/utils/response.js";
import { redis } from "@/db/redis/redis.js";
import { db } from "@/db/drizzle/index.js";
import { users } from "@/db/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { z } from "@/config/openapi/openapi.js";

export const MeResponseSchema = z
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
  .openapi("MeResponse");

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return getResponseError(res, new ResponseError("Missing user ID", 400));
  }
  try {
    const cacheKey = `users:${userId}`;
    const cachedUser = await redis.get(cacheKey);
    if (cachedUser) {
      const parsed = MeResponseSchema.parse(JSON.parse(cachedUser));
      return res.status(200).json(parsed);
    }
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0]) {
      return getResponseError(res, new ResponseError("User not found", 404));
    }
    await redis.set(cacheKey, JSON.stringify(user[0]), { EX: 60 * 60 * 24 });

    const parsed = MeResponseSchema.parse(user[0]);
    return res.status(200).json(parsed);
  } catch (error) {
    return getResponseError(res, error);
  }
};
import { AuthenticatedRequest } from "@/types/request.js";
import { Response } from "express";
import {
  getResponseError,
  getResponseSuccess,
  ResponseError,
} from "@/utils/response.js";
import { redis } from "@/db/redis/redis.js";
import { db } from "@/db/drizzle/index.js";
import { users } from "@/db/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const UpdateProfileBodySchema = z
  .object({
    profileImage: z.string().url(),
    profileImageKey: z.string(),
  })
  .openapi("UpdateProfileBody");

export const updateMeProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.user?.userId;
  if (!userId) {
    return getResponseError(res, new ResponseError("Unauthorized", 401));
  }

  const parsed = UpdateProfileBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return getResponseError(
      res,
      new ResponseError(parsed.error.issues[0].message, 400)
    );
  }

  const { profileImage, profileImageKey } = parsed.data;

  try {
    await db
      .update(users)
      .set({ profileImage, profileImageKey, updatedAt: new Date() })
      .where(eq(users.id, userId));

    await redis.del(`users:${userId}`);

    return getResponseSuccess(res, null, "Profile updated successfully");
  } catch (error) {
    return getResponseError(res, error);
  }
};

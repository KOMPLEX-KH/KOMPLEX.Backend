import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { redis } from "@/db/redis/redisConfig.js";
import { db } from "@/db/index.js";
import { users } from "@/db/schema.js";
import { eq } from "drizzle-orm";
import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";

export const getMe = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
  
    const userId = req.user?.userId;
    if (!userId) {
      return getResponseError(res, new ResponseError("Missing user ID", 400));
    }
    try {
      const cacheKey = `users:${userId}`;
      const cachedUser = await redis.get(cacheKey);
      if (cachedUser) {
        return res.status(200).json(JSON.parse(cachedUser));
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
      return res.status(200).json(user[0]);
    } catch (error) {
      return getResponseError(res, error );
    }
  };
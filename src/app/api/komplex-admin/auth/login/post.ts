import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { users } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const login = async (req: Request, res: Response) => {
  try {
    const { uid } = req.body;
    const cacheKey = `users:${uid}`;

    if (!uid) {
      throw new ResponseError("UID is required", 400);
    }

    const cacheData = await redis.get(cacheKey);
    const parsedCache = cacheData ? JSON.parse(cacheData) : null;

    if (parsedCache) {
      return res.status(200).json(parsedCache);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.uid, uid), eq(users.isAdmin, true)));

    if (!user) {
      throw new ResponseError("Invalid credentials", 401);
    }

    return res.status(200).json(user);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { users } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { z } from "@/config/openapi/openapi.js";

export const LoginBodySchema = z.object({
  uid: z.string(),
}).openapi("AdminLoginBody");

export const LoginResponseSchema = z.object({
  id: z.number(),
  uid: z.string(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
}).openapi("AdminLoginResponse");

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
      return res.status(200).json(LoginResponseSchema.parse(parsedCache));
    }

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.uid, uid), eq(users.isAdmin, true)));

    if (!user) {
      throw new ResponseError("Invalid credentials", 401);
    }

    return res.status(200).json(LoginResponseSchema.parse(user));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

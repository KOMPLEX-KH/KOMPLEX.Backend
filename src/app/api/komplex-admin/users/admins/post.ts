import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { users } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, uid } = req.body;

    if (!firstName || !lastName || !email || !phone || !uid) {
      throw new ResponseError("Missing required fields", 400);
    }

    const result = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email,
        phone,
        uid,
        isAdmin: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const rows = result as any[];
    const createdUser = rows[0];

    const cacheKey = `users:${createdUser.id}`;
    await redis.set(cacheKey, JSON.stringify(createdUser), { EX: 600 });

    return res.status(201).json(createdUser);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

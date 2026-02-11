import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { users } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email } = req.body;

    const result = await db
      .update(users)
      .set({ firstName, lastName, email, updatedAt: new Date() })
      .where(eq(users.id, Number(id)))
      .returning();

    const rows = result as any[];
    const updatedUser = rows[0];

    const cacheKey = `users:${updatedUser.id}`;
    await redis.set(cacheKey, JSON.stringify(updatedUser), { EX: 600 });

    return res.status(200).json(updatedUser);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

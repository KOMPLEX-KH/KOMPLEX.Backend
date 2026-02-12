import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { users } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await db.delete(users).where(eq(users.id, Number(id))).returning();

    await redis.del(`users:${id}`);

    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

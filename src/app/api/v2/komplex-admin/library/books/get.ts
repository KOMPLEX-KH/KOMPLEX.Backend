import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { books } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const getAllBooks = async (req: Request, res: Response) => {
  try {
    const cached = await redis.get("books:all");
    if (cached) {
      return res.status(200).json({ data: JSON.parse(cached) });
    }

    const result = await db.select().from(books);
    await redis.set("books:all", JSON.stringify(result), { EX: 60 * 60 });

    return res.status(200).json({ data: result });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


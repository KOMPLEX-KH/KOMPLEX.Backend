import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { topics } from "@/db/schema.js";
import { eq, gt, sql } from "drizzle-orm";
import { redis } from "@/db/redis/redisConfig.js";

export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [oldOrderIndex] = await db
      .select({ orderIndex: topics.orderIndex })
      .from(topics)
      .where(eq(topics.id, Number(id)));

    if (oldOrderIndex?.orderIndex === null) {
      throw new ResponseError("Old order index not found", 400);
    }

    await db
      .update(topics)
      .set({ orderIndex: sql`${topics.orderIndex} - 1` })
      .where(gt(topics.orderIndex, oldOrderIndex.orderIndex as number));
    await db.delete(topics).where(eq(topics.id, Number(id)));
    await redis.del(`topic:${id}`);
    await redis.del("curriculums");
    await redis.del("curriculums:dashboard");

    return res.status(200).json({ message: "topic deleted successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


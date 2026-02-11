import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { lessons } from "@/db/schema.js";
import { eq, gt, sql } from "drizzle-orm";
import { redis } from "@/db/redis/redisConfig.js";

export const deleteLesson = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [oldOrderIndex] = await db
      .select({ orderIndex: lessons.orderIndex })
      .from(lessons)
      .where(eq(lessons.id, Number(id)));

    if (oldOrderIndex?.orderIndex === null) {
      throw new ResponseError("Old order index not found", 400);
    }

    await db
      .update(lessons)
      .set({ orderIndex: sql`${lessons.orderIndex} - 1` })
      .where(gt(lessons.orderIndex, oldOrderIndex.orderIndex as number));
    await db.delete(lessons).where(eq(lessons.id, Number(id)));
    await redis.del("curriculums");
    await redis.del("curriculums:dashboard");

    return res.status(200).json({ message: "lesson deleted successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


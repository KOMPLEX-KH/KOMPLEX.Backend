import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { subjects } from "@/db/schema.js";
import { eq, gt, sql } from "drizzle-orm";
import { redis } from "@/db/redis/redisConfig.js";

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [oldOrderIndex] = await db
      .select({ orderIndex: subjects.orderIndex })
      .from(subjects)
      .where(eq(subjects.id, Number(id)));

    if (oldOrderIndex?.orderIndex === null) {
      throw new ResponseError("Old order index not found", 400);
    }

    await db
      .update(subjects)
      .set({ orderIndex: sql`${subjects.orderIndex} - 1` })
      .where(gt(subjects.orderIndex, oldOrderIndex.orderIndex as number));
    await db.delete(subjects).where(eq(subjects.id, Number(id)));
    await redis.del("curriculums");
    await redis.del("allSubjects");
    await redis.del("curriculums:dashboard");

    return res.status(200).json({ message: "subject deleted successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


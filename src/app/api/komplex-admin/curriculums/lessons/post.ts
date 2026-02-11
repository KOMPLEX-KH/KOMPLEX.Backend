import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { lessons } from "@/db/schema.js";
import { gt, gte, sql } from "drizzle-orm";
import { redis } from "@/db/redis/redisConfig.js";

export const createLesson = async (req: Request, res: Response) => {
  try {
    const { title, icon, subjectId, orderIndex, insertType } = req.body as {
      title: string;
      icon: string;
      subjectId: number;
      orderIndex: number;
      insertType?: string;
    };

    if (!title || !icon || subjectId === undefined || orderIndex === undefined) {
      throw new ResponseError("Missing required fields", 400);
    }

    let finalOrderIndex = orderIndex;

    if (orderIndex !== undefined && insertType === "before") {
      await db
        .update(lessons)
        .set({ orderIndex: sql`${lessons.orderIndex} + 1` })
        .where(gte(lessons.orderIndex, parseInt(orderIndex.toString())));
      finalOrderIndex = parseInt(orderIndex.toString());
    } else if (orderIndex !== undefined && insertType === "after") {
      await db
        .update(lessons)
        .set({ orderIndex: sql`${lessons.orderIndex} + 1` })
        .where(gt(lessons.orderIndex, parseInt(orderIndex.toString())));
      finalOrderIndex = parseInt(orderIndex.toString()) + 1;
    }

    await db.insert(lessons).values({
      name: title,
      icon,
      subjectId,
      orderIndex: finalOrderIndex,
    });
    await redis.del("curriculums");
    await redis.del("curriculums:dashboard");

    return res.status(201).json({ message: "lesson created successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


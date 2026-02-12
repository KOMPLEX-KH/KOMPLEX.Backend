import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { subjects } from "@/db/schema.js";
import { eq, gt, gte, sql } from "drizzle-orm";
import { redis } from "@/db/redis/redisConfig.js";

export const createSubject = async (req: Request, res: Response) => {
  try {
    const { title, icon, gradeId, orderIndex, insertType } = req.body as {
      title: string;
      icon: string;
      gradeId: number;
      orderIndex: number;
      insertType?: string;
    };

    if (!title || !icon || gradeId === undefined || orderIndex === undefined) {
      throw new ResponseError("Missing required fields", 400);
    }

    let finalOrderIndex = orderIndex;

    if (orderIndex !== undefined && insertType === "before") {
      await db
        .update(subjects)
        .set({ orderIndex: sql`${subjects.orderIndex} + 1` })
        .where(gte(subjects.orderIndex, parseInt(orderIndex.toString())));
      finalOrderIndex = parseInt(orderIndex.toString());
    } else if (orderIndex !== undefined && insertType === "after") {
      await db
        .update(subjects)
        .set({ orderIndex: sql`${subjects.orderIndex} + 1` })
        .where(gt(subjects.orderIndex, parseInt(orderIndex.toString())));
      finalOrderIndex = parseInt(orderIndex.toString()) + 1;
    }

    await db.insert(subjects).values({
      name: title,
      icon,
      gradeId,
      orderIndex: finalOrderIndex,
    });
    await redis.del("allSubjects");
    await redis.del("curriculums");
    await redis.del("curriculums:dashboard");

    return res.status(201).json({ message: "subject created successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


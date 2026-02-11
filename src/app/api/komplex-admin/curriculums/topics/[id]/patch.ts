import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { topics } from "@/db/schema.js";
import { eq, gt, gte, sql } from "drizzle-orm";
import { redis } from "@/db/redis/redisConfig.js";

export const updateTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newName, orderIndex, insertType } = req.body as {
      newName: string;
      orderIndex?: number;
      insertType?: string;
    };

    if (!newName) {
      throw new ResponseError("Missing required fields", 400);
    }

    const oldOrderIndex = await db
      .select({ orderIndex: topics.orderIndex })
      .from(topics)
      .where(eq(topics.id, Number(id)));

    if (oldOrderIndex[0]?.orderIndex === null) {
      throw new ResponseError("Old order index not found", 400);
    }

    if (
      orderIndex !== undefined &&
      insertType === "before" &&
      oldOrderIndex[0].orderIndex !== null
    ) {
      await db
        .update(topics)
        .set({ orderIndex: sql`${topics.orderIndex} + 1` })
        .where(gte(topics.orderIndex, parseInt(orderIndex.toString())));
      await db
        .update(topics)
        .set({ orderIndex: parseInt(orderIndex.toString()) })
        .where(eq(topics.id, Number(id)));
    } else if (
      orderIndex !== undefined &&
      insertType === "after" &&
      oldOrderIndex[0].orderIndex !== null
    ) {
      await db
        .update(topics)
        .set({ orderIndex: sql`${topics.orderIndex} + 1` })
        .where(gt(topics.orderIndex, parseInt(orderIndex.toString())));
      await db
        .update(topics)
        .set({ orderIndex: parseInt(orderIndex.toString()) + 1 })
        .where(eq(topics.id, Number(id)));
    }

    await db
      .update(topics)
      .set({ orderIndex: sql`${topics.orderIndex} - 1` })
      .where(gt(topics.orderIndex, oldOrderIndex[0].orderIndex as number));
    await db
      .update(topics)
      .set({ name: newName })
      .where(eq(topics.id, Number(id)));
    await redis.del("curriculums");
    await redis.del("curriculums:dashboard");

    return res.status(200).json({ message: "topic updated successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


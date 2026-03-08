import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { topics } from "@/db/drizzle/schema.js";
import { eq, gt, sql } from "drizzle-orm";
import { redis } from "@/db/redis/redis.js";
import { z } from "@/config/openapi/openapi.js";

export const DeleteTopicParamsSchema = z.object({
  id: z.number(),
}).openapi("DeleteTopicParams");

export const DeleteTopicResponseSchema = z.object({
  message: z.string(),
}).openapi("DeleteTopicResponse");

export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const { id } = await DeleteTopicParamsSchema.parseAsync(req.params);

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

    return res.status(200).json(DeleteTopicResponseSchema.parse({ message: "topic deleted successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


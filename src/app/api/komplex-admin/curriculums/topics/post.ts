import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { topics } from "@/db/schema.js";
import { gt, gte, sql } from "drizzle-orm";
import { redis } from "@/db/redis/redisConfig.js";
import { z } from "@/config/openapi/openapi.js";

export const CreateTopicBodySchema = z.object({
  title: z.string(),
  lessonId: z.number(),
  orderIndex: z.number(),
  insertType: z.string().optional(),
  exerciseId: z.number().optional(),
}).openapi("CreateTopicBody");

export const CreateTopicResponseSchema = z.object({
  message: z.string(),
}).openapi("CreateTopicResponse");

export const createTopic = async (req: Request, res: Response) => {
  try {
    const { title, lessonId, orderIndex, insertType, exerciseId } = await CreateTopicBodySchema.parseAsync(req.body);

    if (!title || lessonId === undefined || orderIndex === undefined) {
      throw new ResponseError("Missing required fields", 400);
    }

    let finalOrderIndex = orderIndex;

    if (orderIndex !== undefined && insertType === "before") {
      await db
        .update(topics)
        .set({ orderIndex: sql`${topics.orderIndex} + 1` })
        .where(gte(topics.orderIndex, parseInt(orderIndex.toString())));
      finalOrderIndex = parseInt(orderIndex.toString());
    } else if (orderIndex !== undefined && insertType === "after") {
      await db
        .update(topics)
        .set({ orderIndex: sql`${topics.orderIndex} + 1` })
        .where(gt(topics.orderIndex, parseInt(orderIndex.toString())));
      finalOrderIndex = parseInt(orderIndex.toString()) + 1;
    }

    const topicData: any = {
      name: title,
      lessonId,
      component: "[]",
      componentCode: "",
      orderIndex: finalOrderIndex,
    };

    if (exerciseId !== undefined) {
      topicData.exerciseId = exerciseId;
    }

    await db.insert(topics).values(topicData);
    await redis.del("curriculums:dashboard");

    return res.status(201).json(CreateTopicResponseSchema.parse({ message: "topic created successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


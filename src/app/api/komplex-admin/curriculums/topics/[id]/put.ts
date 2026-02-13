import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { topics } from "@/db/schema.js";
import { eq } from "drizzle-orm";
import { redis } from "@/db/redis/redisConfig.js";
import { z } from "@/config/openapi/openapi.js";

export const UpdateTopicComponentParamsSchema = z.object({
  id: z.number(),
}).openapi("UpdateTopicComponentParams");

export const UpdateTopicComponentBodySchema = z.object({
  id: z.number(),
  component: z.any(),
  componentCode: z.string(),
}).openapi("UpdateTopicComponentBody");

export const UpdateTopicComponentResponseSchema = z.object({
  message: z.string(),
}).openapi("UpdateTopicComponentResponse");

export const updateTopicComponent = async (req: Request, res: Response) => {
  try {
    const { id } = await UpdateTopicComponentParamsSchema.parseAsync(req.params);
    const { component, componentCode } = await UpdateTopicComponentBodySchema.parseAsync(req.body);

    if (!component || componentCode === undefined) {
      throw new ResponseError("Missing required fields", 400);
    }

    await db
      .update(topics)
      .set({ component, componentCode })
      .where(eq(topics.id, Number(id)));
    await redis.set(
      `topic:${id}`,
      JSON.stringify({ component, componentCode }),
      {
        EX: 60 * 60 * 24,
      }
    );
    await redis.del("curriculums");
    await redis.del("curriculums:dashboard");

    return res
      .status(200)
      .json(UpdateTopicComponentResponseSchema.parse({ message: "topic component updated successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


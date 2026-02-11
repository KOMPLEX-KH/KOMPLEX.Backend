import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { topics } from "@/db/schema.js";
import { eq } from "drizzle-orm";
import { redis } from "@/db/redis/redisConfig.js";

export const updateTopicComponent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { component, componentCode } = req.body as {
      component: any;
      componentCode: string;
    };

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
      .json({ message: "topic component updated successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


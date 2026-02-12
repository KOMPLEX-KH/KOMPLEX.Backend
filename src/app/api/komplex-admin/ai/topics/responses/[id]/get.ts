import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { userAITopicHistory } from "@/db/schema.js";
import { eq } from "drizzle-orm";

export const getTopicAiResponseById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      throw new ResponseError("Invalid ID parameter", 400);
    }

    const result = await db
      .select()
      .from(userAITopicHistory)
      .where(eq(userAITopicHistory.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new ResponseError("AI topic response not found", 404);
    }

    return res.status(200).json({ data: result[0] });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


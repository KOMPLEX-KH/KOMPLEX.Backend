import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { userAITopicHistory } from "@/db/schema.js";

export const getTopicAiResponses = async (req: Request, res: Response) => {
  try {
    const result = await db.select().from(userAITopicHistory);
    return res.status(200).json({ data: result });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


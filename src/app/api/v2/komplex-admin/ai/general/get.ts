import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { userAIHistory } from "@/db/schema.js";

export const getGeneralAiResponses = async (req: Request, res: Response) => {
  try {
    const result = await db.select().from(userAIHistory);
    return res.status(200).json({ data: result });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


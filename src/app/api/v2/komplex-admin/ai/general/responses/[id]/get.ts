import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { userAIHistory } from "@/db/schema.js";
import { eq } from "drizzle-orm";

export const getGeneralAiResponseById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      throw new ResponseError("Invalid ID parameter", 400);
    }

    const result = await db
      .select()
      .from(userAIHistory)
      .where(eq(userAIHistory.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new ResponseError("AI response not found", 404);
    }

    return res.status(200).json({ data: result[0] });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


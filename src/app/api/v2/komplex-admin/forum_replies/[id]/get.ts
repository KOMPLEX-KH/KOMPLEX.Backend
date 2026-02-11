import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { forumReplies } from "@/db/schema.js";

export const getAllRepliesForAComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const replies = await db
      .select()
      .from(forumReplies)
      .where(eq(forumReplies.forumCommentId, Number(id)));

    return res.status(200).json(replies);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

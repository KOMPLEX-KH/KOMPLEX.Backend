import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { forumLikes } from "@/db/schema.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";

export const unlikeForum = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!userId) {
      throw new ResponseError("Unauthorized", 401);
    }

    const unlike = await db
      .delete(forumLikes)
      .where(
        and(
          eq(forumLikes.userId, Number(userId)),
          eq(forumLikes.forumId, Number(id))
        )
      )
      .returning();

    return res.status(200).json({ data: { unlike } });
  } catch (error) {
    return getResponseError(res, error);
  }
};

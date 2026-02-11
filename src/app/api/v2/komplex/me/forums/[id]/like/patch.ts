import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { db } from "@/db/index.js";
import { forumLikes } from "@/db/schema.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";

export const likeForum = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!userId) {
      throw new ResponseError("Unauthorized", 401);
    }

    const like = await db
      .insert(forumLikes)
      .values({
        userId: Number(userId),
        forumId: Number(id),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return res.status(200).json({ data: { like } });
  } catch (error) {
    return getResponseError(res, error);
  }
};

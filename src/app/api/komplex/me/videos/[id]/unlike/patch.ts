import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { videoLikes } from "@/db/drizzle/schema.js";
import { getResponseError, ResponseError } from "@/utils/response.js";

export const unlikeVideo = async (
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
      .delete(videoLikes)
      .where(
        and(
          eq(videoLikes.userId, Number(userId)),
          eq(videoLikes.videoId, Number(id))
        )
      )
      .returning();

    return res.status(200).json({ data: { unlike } });
  } catch (error) {
    return getResponseError(res, error);
  }
};

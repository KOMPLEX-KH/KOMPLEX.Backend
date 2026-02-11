import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { forums, forumMedias } from "@/db/schema.js";

export const updateForum = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.user ?? {};
    const { title, description, type, topic } = req.body;
    const { id } = req.params;

    const getCorrectUser = await db
      .select()
      .from(forums)
      .where(eq(forums.userId, Number(userId)));

    if (!getCorrectUser || getCorrectUser.length === 0) {
      throw new ResponseError("Forum not found", 404);
    }

    const insertedForums = await db
      .update(forums)
      .set({
        userId: Number(userId),
        title,
        description,
        type,
        topic,
        updatedAt: new Date(),
      })
      .where(eq(forums.id, Number(id)))
      .returning();

    const newForum = insertedForums[0];

    return res.status(200).json({
      forum: newForum,
      media: null,
    });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

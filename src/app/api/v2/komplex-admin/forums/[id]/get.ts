import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { forums } from "@/db/schema.js";

export const getForumById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const forum = await db
      .select()
      .from(forums)
      .where(eq(forums.id, Number(id)))
      .limit(1);

    if (!forum || forum.length === 0 || !forum[0]) {
      throw new ResponseError("Forum not found", 404);
    }

    await db
      .update(forums)
      .set({
        viewCount: (forum[0]?.viewCount ?? 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(forums.id, Number(id)))
      .returning();

    return res.status(200).json(forum[0]);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

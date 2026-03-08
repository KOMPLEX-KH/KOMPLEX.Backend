import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { forums, forumMedias } from "@/db/drizzle/schema.js";
import { z } from "@/config/openapi/openapi.js";

export const AdminUpdateForumParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("AdminUpdateForumParams");

export const AdminUpdateForumBodySchema = z
  .object({
    title: z.string(),
    description: z.string(),
    type: z.string().optional(),
    topic: z.string().optional(),
  })
  .openapi("AdminUpdateForumBody");

export const AdminUpdateForumResponseSchema = z
  .object({
    forum: z.any(),
    media: z.any(),
  })
  .openapi("AdminUpdateForumResponse");

export const updateForum = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.user ?? {};
    const { title, description, type, topic } =
      await AdminUpdateForumBodySchema.parseAsync(req.body);
    const { id } = await AdminUpdateForumParamsSchema.parseAsync(req.params);

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

    const responseBody = AdminUpdateForumResponseSchema.parse({
      forum: newForum,
      media: null,
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

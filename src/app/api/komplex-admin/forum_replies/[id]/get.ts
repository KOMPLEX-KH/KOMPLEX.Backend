import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { forumReplies } from "@/db/schema.js";
import { z } from "@/config/openapi/openapi.js";

export const AdminGetForumRepliesParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("AdminGetForumRepliesParams");

export const AdminGetForumRepliesResponseSchema = z
  .array(z.any())
  .openapi("AdminGetForumRepliesResponse");

export const getAllRepliesForAComment = async (req: Request, res: Response) => {
  try {
    const { id } = await AdminGetForumRepliesParamsSchema.parseAsync(req.params);

    const replies = await db
      .select()
      .from(forumReplies)
      .where(eq(forumReplies.forumCommentId, Number(id)));

    const responseBody = AdminGetForumRepliesResponseSchema.parse(replies);

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

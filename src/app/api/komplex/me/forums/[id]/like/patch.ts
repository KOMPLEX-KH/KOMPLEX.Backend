import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { db } from "@/db/drizzle/index.js";
import { forumLikes } from "@/db/drizzle/schema.js";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

export const MeLikeForumParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MeLikeForumParams");

export const MeLikeForumResponseSchema = z
  .object({
    data: z.object({
      like: z.array(z.any()),
    }),
  })
  .openapi("MeLikeForumResponse");

export const likeForum = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = await MeLikeForumParamsSchema.parseAsync(req.params);

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

    const responseBody = MeLikeForumResponseSchema.parse({ data: { like } });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error);
  }
};

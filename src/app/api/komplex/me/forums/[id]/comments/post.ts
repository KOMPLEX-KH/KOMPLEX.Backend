import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { forumComments, forumCommentMedias, users } from "@/db/drizzle/schema.js";
import { sendResponseError, ResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

const ForumMediaKeySchema = z.object({
  key: z.string(),
  url: z.string(),
  mediaType: z.enum(["image", "video"]),
});

export const MePostForumCommentParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MePostForumCommentParams");

export const MePostForumCommentBodySchema = z
  .object({
    description: z.string(),
    mediaKeys: z.array(ForumMediaKeySchema).optional().default([]),
  })
  .openapi("MePostForumCommentBody");

export const MePostForumCommentResponseSchema = z
  .object({
    data: z.object({
      id: z.number(),
      userId: z.number(),
      description: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
      username: z.string(),
      profileImage: z.string().nullable().optional(),
      isSave: z.boolean(),
      media: z.array(
        z.object({
          url: z.string(),
          type: z.string(),
        })
      ),
    }),
    success: z.literal(true),
  })
  .openapi("MePostForumCommentResponse");

export const postForumComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = await MePostForumCommentParamsSchema.parseAsync(req.params);
    const { description, mediaKeys } = await MePostForumCommentBodySchema.parseAsync(
      req.body ?? {}
    );
    const limit = 40;

    if (!userId) {
      throw new ResponseError("Missing required user", 400);
    }

    const newCommentMedia: { url: string; mediaType: string }[] = [];
    const [newForumComment] = await db.transaction(async (tx) => {
      const [comment] = await tx
        .insert(forumComments)
        .values({
          userId: Number(userId),
          forumId: Number(id),
          description,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      for (const { key, url, mediaType } of mediaKeys) {
        const [media] = await tx
          .insert(forumCommentMedias)
          .values({
            forumCommentId: comment.id,
            url,
            urlForDeletion: key,
            mediaType,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        newCommentMedia.push({ url: media.url ?? '', mediaType: (media.mediaType ?? "image") });
      }
      return [comment];
    });

    const [username] = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        profileImage: users.profileImage,
      })
      .from(users)
      .where(eq(users.id, Number(userId)));

    const forumCommentWithMedia = {
      id: newForumComment.id,
      userId: newForumComment.userId,
      description: newForumComment.description,
      createdAt: newForumComment.createdAt,
      updatedAt: newForumComment.updatedAt,
      username: `${username?.firstName ?? ""} ${username?.lastName ?? ""}`.trim(),
      profileImage: username?.profileImage ?? undefined,
      isSave: false,
      media: newCommentMedia.map((m) => ({ url: m.url, type: m.mediaType })),
    };

    let { currentCommentAmount, lastPage } = JSON.parse(
      (await redis.get(`forumComments:forum:${id}:lastPage`)) ||
      JSON.stringify({ currentCommentAmount: 0, lastPage: 1 })
    );

    if (currentCommentAmount >= limit) {
      lastPage += 1;
      currentCommentAmount = 1;
    } else {
      currentCommentAmount += 1;
    }

    const cacheKey = `forumComments:forum:${id}:page:${lastPage}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      const parsed = JSON.parse(cached);
      parsed.push(forumCommentWithMedia);
      await redis.set(cacheKey, JSON.stringify(parsed), { EX: 600 });
    } else {
      await redis.set(cacheKey, JSON.stringify([forumCommentWithMedia]), {
        EX: 600,
      });
    }

    await redis.set(
      `forumComments:forum:${id}:lastPage`,
      JSON.stringify({ currentCommentAmount, lastPage }),
      {
        EX: 600,
      }
    );

    const responseBody = MePostForumCommentResponseSchema.parse({
      data: forumCommentWithMedia,
      success: true,
    });

    return res.status(201).json(responseBody);
  } catch (error) {
    return sendResponseError(res, error);
  }
};

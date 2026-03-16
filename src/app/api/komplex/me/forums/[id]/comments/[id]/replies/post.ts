import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { forumReplies, forumReplyMedias, users } from "@/db/drizzle/schema.js";
import { sendResponseError, ResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

const ForumMediaKeySchema = z.object({
  key: z.string(),
  url: z.string(),
  mediaType: z.enum(["image", "video"]),
});

export const MePostForumReplyParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MePostForumReplyParams");

export const MePostForumReplyBodySchema = z
  .object({
    description: z.string(),
    mediaKeys: z.array(ForumMediaKeySchema).optional().default([]),
  })
  .openapi("MePostForumReplyBody");

export const MePostForumReplyResponseSchema = z
  .object({
    data: z.object({
      success: z.literal(true),
      reply: z.any(),
      newReplyMedia: z.array(
        z.object({
          url: z.string(),
          type: z.string(),
        })
      ),
    }),
  })
  .openapi("MePostForumReplyResponse");

export const postForumReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = await MePostForumReplyParamsSchema.parseAsync(req.params);
    const { description, mediaKeys } = await MePostForumReplyBodySchema.parseAsync(
      req.body ?? {}
    );
    const limit = 20;

    if (!userId || !id || !description) {
      throw new ResponseError("Missing required fields", 400);
    }

    const newReplyMedia: { url: string; mediaType: string }[] = [];
    const [insertedForumReply] = await db.transaction(async (tx) => {
      const [reply] = await tx
        .insert(forumReplies)
        .values({
          userId: Number(userId),
          forumCommentId: Number(id),
          description,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      for (const { key, url, mediaType } of mediaKeys) {
        const [media] = await tx
          .insert(forumReplyMedias)
          .values({
            forumReplyId: reply.id,
            url,
            urlForDeletion: key,
            mediaType,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        newReplyMedia.push({
          url: media.url ?? "",
          mediaType: (media.mediaType ?? "image") as string,
        });
      }
      return [reply];
    });

    const [username] = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        profileImage: users.profileImage,
      })
      .from(users)
      .where(eq(users.id, Number(userId)));

    const replyWithMedia = {
      id: insertedForumReply.id,
      userId: insertedForumReply.userId,
      forumCommentId: insertedForumReply.forumCommentId,
      description: insertedForumReply.description,
      createdAt: insertedForumReply.createdAt,
      updatedAt: insertedForumReply.updatedAt,
      username: `${username?.firstName ?? ""} ${username?.lastName ?? ""}`.trim(),
      profileImage: username?.profileImage ?? undefined,
      media: newReplyMedia.map((m) => ({ url: m.url, type: m.mediaType })),
    };

    let { currentReplyAmount, lastPage } = JSON.parse(
      (await redis.get(`forumReplies:comment:${id}:lastPage`)) ||
      JSON.stringify({ currentReplyAmount: 0, lastPage: 1 })
    );

    if (currentReplyAmount >= limit) {
      lastPage += 1;
      currentReplyAmount = 1;
    } else {
      currentReplyAmount += 1;
    }

    const cacheKey = `forumReplies:comment:${id}:page:${lastPage}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      const parsed = JSON.parse(cached);
      parsed.repliesWithMedia.push(replyWithMedia);
      await redis.set(cacheKey, JSON.stringify(parsed), { EX: 600 });
    } else {
      await redis.set(
        cacheKey,
        JSON.stringify({ repliesWithMedia: [replyWithMedia] }),
        { EX: 600 }
      );
    }

    await redis.set(
      `forumReplies:comment:${id}:lastPage`,
      JSON.stringify({ currentReplyAmount, lastPage }),
      {
        EX: 600,
      }
    );

    return res.status(201).json({
      data: {
        success: true,
        reply: insertedForumReply,
        newReplyMedia: newReplyMedia.map((m) => ({ url: m.url, type: m.mediaType })),
      },
    });
  } catch (error) {
    return sendResponseError(res, error);
  }
};

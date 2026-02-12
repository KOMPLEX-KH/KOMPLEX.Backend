import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { forumReplies, forumReplyMedias, users } from "@/db/schema.js";
import { uploadImageToCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import crypto from "crypto";

export const postForumReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { description } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;
    const limit = 20;

    if (!userId || !id || !description) {
      throw new ResponseError("Missing required fields", 400);
    }

    const [insertedForumReply] = await db
      .insert(forumReplies)
      .values({
        userId: Number(userId),
        forumCommentId: Number(id),
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    let newReplyMedia: any[] = [];
    if (files) {
      for (const file of files) {
        try {
          const uniqueKey = `${insertedForumReply.id}-${crypto.randomUUID()}-${
            file.originalname
          }`;
          const url = await uploadImageToCloudflare(
            uniqueKey,
            file.buffer,
            file.mimetype
          );
          const [media] = await db
            .insert(forumReplyMedias)
            .values({
              forumReplyId: insertedForumReply.id,
              url: url,
              urlForDeletion: uniqueKey,
              mediaType: file.mimetype.startsWith("video") ? "video" : "image",
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          newReplyMedia.push(media);
        } catch (error) {
          throw new ResponseError(error as string, 500);
        }
      }
    }

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
      username: username.firstName + " " + username.lastName,
      profileImage: username.profileImage,
      media: newReplyMedia.map((m) => ({
        url: m.url,
        type: m.mediaType,
      })),
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
        newReplyMedia,
      },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};

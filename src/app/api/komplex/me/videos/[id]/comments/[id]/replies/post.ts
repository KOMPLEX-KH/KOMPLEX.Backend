import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { videoReplies, videoReplyMedias, users } from "@/db/drizzle/schema.js";
import { uploadVideoToCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { getResponseError, ResponseError } from "@/utils/response.js";
import crypto from "crypto";

export const postVideoReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { description } = req.body;
    const { id } = req.params;
    const files = req.files as Express.Multer.File[] | undefined;

    if (!userId || !id || !description) {
      throw new ResponseError("Missing required fields", 400);
    }

    const [insertReply] = await db
      .insert(videoReplies)
      .values({
        userId: Number(userId),
        videoCommentId: Number(id),
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    let newVideoReplyMedia: any[] = [];
    if (files) {
      for (const file of files) {
        try {
          const uniqueKey = `${insertReply.id}-${crypto.randomUUID()}-${file.originalname
            }`;
          const url = await uploadVideoToCloudflare(
            uniqueKey,
            file.buffer,
            file.mimetype
          );
          const [media] = await db
            .insert(videoReplyMedias)
            .values({
              videoReplyId: insertReply.id,
              url: url,
              urlForDeletion: uniqueKey,
              mediaType: file.mimetype.startsWith("video") ? "video" : "image",
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          newVideoReplyMedia.push(media);
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
      id: insertReply.id,
      userId: insertReply.userId,
      videoCommentId: insertReply.videoCommentId,
      description: insertReply.description,
      createdAt: insertReply.createdAt,
      updatedAt: insertReply.updatedAt,
      username: username.firstName + " " + username.lastName,
      profileImage: username.profileImage,
      media: newVideoReplyMedia.map((m) => ({
        url: m.url,
        type: m.mediaType,
      })),
    };

    const limit = 20;
    let { currentReplyAmount, lastPage } = JSON.parse(
      (await redis.get(`videoReplies:comment:${id}:lastPage`)) ||
      JSON.stringify({ currentReplyAmount: 0, lastPage: 1 })
    );

    if (currentReplyAmount >= limit) {
      lastPage += 1;
      currentReplyAmount = 1;
    } else {
      currentReplyAmount += 1;
    }

    const cacheKey = `videoReplies:comment:${id}:page:${lastPage}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      const parsed = JSON.parse(cached);
      const list = Array.isArray(parsed)
        ? parsed
        : parsed?.repliesWithMedia || [];
      list.push(replyWithMedia);
      await redis.set(cacheKey, JSON.stringify({ repliesWithMedia: list }), {
        EX: 600,
      });
    } else {
      await redis.set(
        cacheKey,
        JSON.stringify({ repliesWithMedia: [replyWithMedia] }),
        { EX: 600 }
      );
    }

    await redis.set(
      `videoReplies:comment:${id}:lastPage`,
      JSON.stringify({ currentReplyAmount, lastPage }),
      {
        EX: 600,
      }
    );

    return res.status(201).json({
      data: {
        success: true,
        reply: insertReply,
        newVideoReplyMedia,
      },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};

import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { videoComments, videoCommentMedias, users } from "@/db/schema.js";
import { uploadVideoToCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import crypto from "crypto";

export const postVideoComment = async (
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

    const [insertComment] = await db
      .insert(videoComments)
      .values({
        userId: Number(userId),
        videoId: Number(id),
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    let newCommentMedia: any[] = [];
    if (files) {
      for (const file of files) {
        try {
          const uniqueKey = `${insertComment.id}-${crypto.randomUUID()}-${
            file.originalname
          }`;
          const url = await uploadVideoToCloudflare(
            uniqueKey,
            file.buffer,
            file.mimetype
          );
          const [media] = await db
            .insert(videoCommentMedias)
            .values({
              videoCommentId: insertComment.id,
              url: url,
              urlForDeletion: uniqueKey,
              mediaType: file.mimetype.startsWith("video") ? "video" : "image",
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          newCommentMedia.push(media);
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
    const videoCommentWithMedia = {
      id: insertComment.id,
      userId: insertComment.userId,
      description: insertComment.description,
      createdAt: insertComment.createdAt,
      updatedAt: insertComment.updatedAt,
      username: username.firstName + " " + username.lastName,
      profileImage: username.profileImage,
      media: newCommentMedia.map((m) => ({
        url: m.url,
        type: m.mediaType,
      })),
    };
    const limit = 20;
    let { currentCommentAmount, lastPage } = JSON.parse(
      (await redis.get(`videoComments:video:${id}:lastPage`)) ||
        JSON.stringify({ currentCommentAmount: 0, lastPage: 1 })
    );

    if (currentCommentAmount >= limit) {
      lastPage += 1;
      currentCommentAmount = 1;
    } else {
      currentCommentAmount += 1;
    }

    const cacheKey = `videoComments:video:${id}:page:${lastPage}`;

    const cached = await redis.get(cacheKey);

    if (cached) {
      const parsed = JSON.parse(cached);
      const list = Array.isArray(parsed)
        ? parsed
        : parsed?.commentsWithMedia || [];
      list.push(videoCommentWithMedia);
      await redis.set(cacheKey, JSON.stringify({ commentsWithMedia: list }), {
        EX: 600,
      });
    } else {
      await redis.set(
        cacheKey,
        JSON.stringify({ commentsWithMedia: [videoCommentWithMedia] }),
        { EX: 600 }
      );
    }

    await redis.set(
      `videoComments:video:${id}:lastPage`,
      JSON.stringify({ currentCommentAmount, lastPage }),
      {
        EX: 600,
      }
    );

    return res.status(201).json({
      data: {
        success: true,
        comment: insertComment,
        newCommentMedia,
      },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};

import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { forumComments, forumCommentMedias, users } from "@/db/schema.js";
import { uploadImageToCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import crypto from "crypto";
import { z } from "@/config/openapi/openapi.js";

export const MePostForumCommentParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MePostForumCommentParams");

export const MePostForumCommentBodySchema = z
  .object({
    description: z.string(),
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
    const { description } = await MePostForumCommentBodySchema.parseAsync(
      req.body
    );
    const files = req.files as Express.Multer.File[] | undefined;
    const limit = 40;

    if (!userId) {
      throw new ResponseError("Missing required user", 400);
    }

    const [newForumComment] = await db
      .insert(forumComments)
      .values({
        userId: Number(userId),
        forumId: Number(id),
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    let newCommentMedia: any[] = [];
    if (files) {
      for (const file of files) {
        try {
          const uniqueKey = `${newForumComment.id}-${crypto.randomUUID()}-${
            file.originalname
          }`;
          const url = await uploadImageToCloudflare(
            uniqueKey,
            file.buffer,
            file.mimetype
          );
          const [media] = await db
            .insert(forumCommentMedias)
            .values({
              forumCommentId: newForumComment.id,
              url: url,
              urlForDeletion: uniqueKey,
              mediaType: file.mimetype.startsWith("video") ? "video" : "image",
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          newCommentMedia.push(media);
        } catch (error) {
          console.error("Error uploading file or saving media:", error);
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

    const forumCommentWithMedia = {
      id: newForumComment.id,
      userId: newForumComment.userId,
      description: newForumComment.description,
      createdAt: newForumComment.createdAt,
      updatedAt: newForumComment.updatedAt,
      username: username.firstName + " " + username.lastName,
      profileImage: username.profileImage,
      isSave: false,
      media: newCommentMedia.map((m) => ({
        url: m.url,
        type: m.mediaType,
      })),
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
    return getResponseError(res, error);
  }
};

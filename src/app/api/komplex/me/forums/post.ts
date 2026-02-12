import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { forums, forumMedias, users } from "@/db/schema.js";
import { uploadImageToCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { meilisearch } from "@/config/meilisearchConfig.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import crypto from "crypto";

export const postForum = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { title, description, type, topic } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;

    if (!userId || !title || !description) {
      throw new ResponseError("Missing required fields", 400);
    }

    const [newForum] = await db
      .insert(forums)
      .values({
        userId: Number(userId),
        title,
        description,
        type,
        topic,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    let newForumMedia: any[] = [];
    if (files) {
      for (const file of files) {
        try {
          const uniqueKey = `${newForum.id}-${crypto.randomUUID()}-${
            file.originalname
          }`;
          const url = await uploadImageToCloudflare(
            uniqueKey,
            file.buffer,
            file.mimetype
          );
          const [media] = await db
            .insert(forumMedias)
            .values({
              forumId: newForum.id,
              url: url,
              urlForDeletion: uniqueKey,
              mediaType: file.mimetype.startsWith("video") ? "video" : "image",
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          newForumMedia.push(media);
        } catch (error) {
          throw new ResponseError(error as string, 500);
        }
      }
    }

    const [username] = await db
      .select({ firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, Number(userId)));

    const forumWithMedia = {
      id: newForum.id,
      userId: newForum.userId,
      title: newForum.title,
      description: newForum.description,
      type: newForum.type,
      topic: newForum.topic,
      viewCount: newForum.viewCount,
      createdAt: newForum.createdAt,
      updatedAt: newForum.updatedAt,
      username: username.firstName + " " + username.lastName,
      isSave: false,
      media: newForumMedia.map((m) => ({
        url: m.url,
        type: m.mediaType,
      })),
    };

    const redisKey = `forums:${newForum.id}`;
    const meilisearchData = {
      id: forumWithMedia.id,
      title: forumWithMedia.title,
      description: forumWithMedia.description,
    };

    await meilisearch.index("forums").addDocuments([meilisearchData]);
    await redis.set(redisKey, JSON.stringify(forumWithMedia), { EX: 600 });
    await redis.del(`dashboardData:${userId}`);

    const myForumKeys: string[] = await redis.keys(
      `userForums:${userId}:type:*:topic:*:page:*`
    );
    if (myForumKeys.length > 0) {
      await redis.del(myForumKeys);
    }

    return res.status(201).json({
      data: { success: true, newForum, newForumMedia },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};

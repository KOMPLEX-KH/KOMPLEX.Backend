import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { forums, forumMedias, users } from "@/db/schema.js";
import {
  uploadImageToCloudflare,
  deleteFromCloudflare,
} from "@/db/cloudflare/cloudflareFunction.js";
import { meilisearch } from "@/config/meilisearchConfig.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import crypto from "crypto";

export const updateForum = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { title, description, type, topic, photosToRemove } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;

    const doesUserOwnThisForum = await db
      .select()
      .from(forums)
      .where(and(eq(forums.id, Number(id)), eq(forums.userId, Number(userId))))
      .limit(1);
    if (doesUserOwnThisForum.length === 0) {
      throw new ResponseError("Forum not found", 404);
    }

    let photosToRemoveParse: { url: string }[] = [];
    if (photosToRemove) {
      try {
        photosToRemoveParse = JSON.parse(photosToRemove);
      } catch (err) {
        throw new ResponseError("Invalid photosToRemove format", 400);
      }
    }

    let newForumMedia: any[] = [];
    if (files) {
      for (const file of files) {
        try {
          const uniqueKey = `${id}-${crypto.randomUUID()}-${file.originalname}`;
          const url = await uploadImageToCloudflare(
            uniqueKey,
            file.buffer,
            file.mimetype
          );
          const [media] = await db
            .insert(forumMedias)
            .values({
              forumId: Number(id),
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

    let deleteMedia = null;
    if (photosToRemoveParse && photosToRemoveParse.length > 0) {
      try {
        const deleteResults = await Promise.all(
          photosToRemoveParse.map(async (photoToRemove: any) => {
            const urlForDeletion = await db
              .select({
                urlForDeletion: forumMedias.urlForDeletion,
              })
              .from(forumMedias)
              .where(eq(forumMedias.url, photoToRemove.url));
            let deleted = null;
            if (urlForDeletion[0]?.urlForDeletion) {
              await deleteFromCloudflare(
                "komplex-image",
                urlForDeletion[0].urlForDeletion
              );
              deleted = await db
                .delete(forumMedias)
                .where(
                  and(
                    eq(forumMedias.forumId, Number(id)),
                    eq(forumMedias.urlForDeletion, urlForDeletion[0].urlForDeletion)
                  )
                )
                .returning();
            }
            return deleted;
          })
        );
        deleteMedia = deleteResults.flat();
      } catch (error) {
        throw new ResponseError(error as string, 500);
      }
    }

    const [updateForum] = await db
      .update(forums)
      .set({
        title,
        description,
        type,
        topic,
        updatedAt: new Date(),
      })
      .where(eq(forums.id, Number(id)))
      .returning();

    const forum = await db
      .select({
        id: forums.id,
        userId: forums.userId,
        title: forums.title,
        description: forums.description,
        type: forums.type,
        topic: forums.topic,
        createdAt: forums.createdAt,
        updatedAt: forums.updatedAt,
        mediaUrl: forumMedias.url,
        mediaType: forumMedias.mediaType,
        username: sql`${users.firstName} || ' ' || ${users.lastName}`,
      })
      .from(forums)
      .leftJoin(forumMedias, eq(forums.id, forumMedias.forumId))
      .leftJoin(users, eq(forums.userId, users.id))
      .where(eq(forums.id, Number(id)));

    const forumWithMedia = {
      id: forum[0].id,
      userId: forum[0].userId,
      title: forum[0].title,
      description: forum[0].description,
      type: forum[0].type,
      topic: forum[0].topic,
      createdAt: forum[0].createdAt,
      updatedAt: forum[0].updatedAt,
      username: forum[0]?.username,
      media: forum
        .filter((b) => b.mediaUrl)
        .map((b) => ({
          url: b.mediaUrl,
          type: b.mediaType,
        })),
    };

    const meilisearchData = {
      id: forumWithMedia.id,
      title: forumWithMedia.title,
      description: forumWithMedia.description,
    };
    await meilisearch.index("forums").addDocuments([meilisearchData]);
    await redis.set(`forums:${id}`, JSON.stringify(forumWithMedia), {
      EX: 600,
    });
    await redis.del(`dashboardData:${userId}`);
    const myForumKeys: string[] = await redis.keys(
      `userForums:${userId}:type:*:topic:*:page:*`
    );

    if (myForumKeys.length > 0) {
      await redis.del(myForumKeys);
    }

    return res.status(200).json({
      data: { updateForum, newForumMedia, deleteMedia },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};

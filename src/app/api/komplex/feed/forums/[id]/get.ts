import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, getResponseSuccess, ResponseError } from "@/utils/response.js";
import { redis } from "@/db/redis/redis.js";
import { followers, forumLikes, forumMedias, forums, users } from "@/db/drizzle/schema.js";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { z } from "@/config/openapi/openapi.js";
import { MediaSchema } from "@/types/zod/media.schema.js";

export const FeedForumItemResponseSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  type: z.string(),
  topic: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  username: z.string(),
  profileImage: z.string().nullable().optional(),
  media: z.array(MediaSchema),
  viewCount: z.number(),
  likeCount: z.number(),
  isLiked: z.boolean(),
  isFollowing: z.boolean(),
}).openapi("FeedForumItemResponseSchema");

export const getForumById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const cacheKey = `forums:${id}`;
    const cached = await redis.get(cacheKey);
    let forumData;
    if (cached) {
      forumData = FeedForumItemResponseSchema.parse(JSON.parse(cached));
    } else {
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
          profileImage: users.profileImage,
        })
        .from(forums)
        .leftJoin(forumMedias, eq(forums.id, forumMedias.forumId))
        .leftJoin(users, eq(forums.userId, users.id))
        .where(eq(forums.id, Number(id)));

      if (!forum || forum.length === 0) {
        throw new ResponseError("Forum not found", 404);
      }

      const forumMap = new Map<number, any>();
      for (const f of forum) {
        if (!forumMap.has(f.id)) {
          forumMap.set(f.id, {
            id: f.id,
            userId: f.userId,
            title: f.title,
            description: f.description,
            type: f.type,
            topic: f.topic,
            createdAt: f.createdAt,
            updatedAt: f.updatedAt,
            username: f.username,
            profileImage: f.profileImage,
            media: [] as { url: string; type: string }[],
          });
        }
        if (f.mediaUrl) {
          forumMap.get(f.id).media.push({
            url: f.mediaUrl,
            type: f.mediaType,
          });
        }
      }

      forumData = forumMap.get(forum[0].id);

      await redis.set(cacheKey, JSON.stringify(forumData), {
        EX: 600,
      });
    }

    await db
      .update(forums)
      .set({
        viewCount: sql`${forums.viewCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(forums.id, Number(id)));

    const dynamic = await db
      .select({
        id: forums.id,
        viewCount: forums.viewCount,
        likeCount: sql`COUNT(DISTINCT ${forumLikes.id})`,
        isLiked: sql`CASE WHEN ${forumLikes.forumId} IS NOT NULL THEN true ELSE false END`,
        profileImage: users.profileImage,
      })
      .from(forums)
      .leftJoin(
        forumLikes,
        and(
          eq(forumLikes.forumId, forums.id),
          eq(forumLikes.userId, Number(userId))
        )
      )
      .leftJoin(users, eq(forums.userId, users.id))
      .where(eq(forums.id, Number(id)))
      .groupBy(forums.id, forumLikes.forumId, users.profileImage);

    const isFollowing = await db
      .select()
      .from(followers)
      .where(
        and(
          eq(followers.followedId, Number(forumData.userId)),
          eq(followers.userId, userId)
        )
      );

    const forumWithMedia = {
      ...forumData,
      viewCount: (dynamic[0]?.viewCount ?? 0) + 1,
      likeCount: Number(dynamic[0]?.likeCount) || 0,
      isLiked: !!dynamic[0]?.isLiked,
      isFollowing: isFollowing.length > 0,
      profileImage: dynamic[0]?.profileImage || forumData.profileImage,
    };
    // parse first before response to ensure the response is valid
    const responseBody = FeedForumItemResponseSchema.parse(forumWithMedia);
    // wrap in success and data
    return getResponseSuccess(res, responseBody);
  } catch (error) {
    return getResponseError(res, error);
  }
};
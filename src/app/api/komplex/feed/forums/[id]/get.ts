import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { redis } from "@/db/redis/redisConfig.js";
import { followers, forumLikes, forumMedias, forums, users } from "@/db/schema.js";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/index.js";

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
      forumData = JSON.parse(cached);
    } else {
      const forum = await db
        .select({
          id: forums.id,
          userId: forums.userId,
          title: forums.title,
          description: forums.description,
          type: forums.type,
          topic: forums.topic,
          viewCount: forums.viewCount,
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

      forumData = {
        id: forum[0].id,
        userId: forum[0].userId,
        title: forum[0].title,
        description: forum[0].description,
        type: forum[0].type,
        topic: forum[0].topic,
        createdAt: forum[0].createdAt,
        updatedAt: new Date(),
        username: forum[0].username,
        profileImage: forum[0].profileImage,
        media: forum
          .filter((f) => f.mediaUrl)
          .map((f) => ({
            url: f.mediaUrl,
            type: f.mediaType,
          })),
      };

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
      isFollowing: isFollowing.length > 0,
      viewCount: dynamic[0]?.viewCount ?? 0,
      likeCount: Number(dynamic[0]?.likeCount) || 0,
      isLiked: !!dynamic[0]?.isLiked,
      profileImage: dynamic[0]?.profileImage || forumData.profileImage,
    };

    return res.status(200).json({ data: forumWithMedia });
  } catch (error) {
    return getResponseError(res, error );
  }
};
import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq, desc, sql, inArray } from "drizzle-orm";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import {
  forums,
  forumMedias,
  users,
  forumLikes,
  followers,
} from "@/db/schema.js";
import { getResponseError } from "@/utils/responseError.js";
import { z } from "@/config/openapi/openapi.js";

const FeedForumMediaSchema = z.object({
  url: z.string(),
  type: z.string(),
});

const FeedForumItemSchema = z.object({
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
  media: z.array(FeedForumMediaSchema),
  viewCount: z.number(),
  likeCount: z.number(),
  isLiked: z.boolean(),
  isFollowing: z.boolean(),
});

export const FeedForumsResponseSchema = z
  .object({
    data: z.array(FeedForumItemSchema),
    hasMore: z.boolean(),
  })
  .openapi("FeedForumsResponse");

export const getAllForums = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { type, topic, page } = req.query;

    const conditions = [];
    if (type) conditions.push(eq(forums.type, type as string));
    if (topic) conditions.push(eq(forums.topic, topic as string));

    const pageNumber = Number(page) || 1;
    const limit = 20;
    const offset = (pageNumber - 1) * limit;

    const followedUsersForumIds = await db
      .select({ id: forums.id, userId: forums.userId })
      .from(forums)
      .where(
        inArray(
          forums.userId,
          db
            .select({ followedId: followers.followedId })
            .from(followers)
            .where(eq(followers.userId, Number(userId)))
        )
      )
      .orderBy(
        desc(
          sql`CASE WHEN DATE(${forums.updatedAt}) = CURRENT_DATE THEN 1 ELSE 0 END`
        ),
        desc(forums.viewCount),
        desc(forums.updatedAt)
      )
      .limit(5);

    const forumIds = await db
      .select({ id: forums.id, userId: forums.userId })
      .from(forums)
      .where(
        and(
          conditions.length > 0 ? and(...conditions) : undefined
        )
      )
      .orderBy(
        desc(
          sql`CASE WHEN DATE(${forums.updatedAt}) = CURRENT_DATE THEN 1 ELSE 0 END`
        ),
        desc(forums.viewCount),
        desc(forums.updatedAt)
      )
      .offset(offset)
      .limit(limit);

    const forumIdRows = Array.from(
      new Set([
        ...followedUsersForumIds.map((f) => f.id),
        ...forumIds.map((f) => f.id),
      ])
    ).map((id) => ({ id }));

    if (!forumIdRows.length) {
      const emptyBody = FeedForumsResponseSchema.parse({
        data: [],
        hasMore: false,
      });
      return res.status(200).json(emptyBody);
    }

    const cachedResults = (await redis.mGet(
      forumIdRows.map((f) => `forums:${f.id}`)
    )) as (string | null)[];

    const hits: any[] = [];
    const missedIds: number[] = [];

    if (cachedResults.length > 0) {
      cachedResults.forEach((item, idx) => {
        if (item) hits.push(JSON.parse(item));
        else missedIds.push(forumIdRows[idx].id);
      });
    }

    let missedForums: any[] = [];
    if (missedIds.length > 0) {
      const forumRows = await db
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
        .where(inArray(forums.id, missedIds));

      const forumMap = new Map<number, any>();
      for (const forum of forumRows) {
        if (!forumMap.has(forum.id)) {
          const formatted = {
            id: forum.id,
            userId: forum.userId,
            title: forum.title,
            description: forum.description,
            type: forum.type,
            topic: forum.topic,
            createdAt: forum.createdAt,
            updatedAt: forum.updatedAt,
            username: forum.username,
            profileImage: forum.profileImage,
            media: [] as { url: string; type: string }[],
          };
          forumMap.set(forum.id, formatted);
          missedForums.push(formatted);
        }

        if (forum.mediaUrl) {
          forumMap.get(forum.id).media.push({
            url: forum.mediaUrl,
            type: forum.mediaType,
          });
        }
      }

      for (const forum of missedForums) {
        await redis.set(`forums:${forum.id}`, JSON.stringify(forum), { EX: 600 });
      }
    }

    const allForumsMap = new Map<number, any>();
    for (const forum of [...hits, ...missedForums]) {
      allForumsMap.set(forum.id, forum);
    }

    const forumsNeedingProfileImage = [...hits].filter(
      (forum) => !forum.profileImage
    );
    if (forumsNeedingProfileImage.length > 0) {
      const profileImageData = await db
        .select({
          id: forums.id,
          profileImage: users.profileImage,
        })
        .from(forums)
        .leftJoin(users, eq(forums.userId, users.id))
        .where(
          inArray(
            forums.id,
            forumsNeedingProfileImage.map((f) => f.id)
          )
        );

      for (const profileData of profileImageData) {
        const forum = allForumsMap.get(profileData.id);
        if (forum) {
          forum.profileImage = profileData.profileImage;
        }
      }
    }

    const allForums = forumIdRows.map((f) => allForumsMap.get(f.id));

    const dynamicData = await db
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
      .where(
        inArray(
          forums.id,
          forumIdRows.map((f) => f.id)
        )
      )
      .groupBy(forums.id, forumLikes.forumId, users.profileImage);

    const forumsWithMedia = allForums.map((f) => {
      const dynamic = dynamicData.find((d) => d.id === f.id);
      return {
        ...f,
        viewCount: (dynamic?.viewCount ?? 0) + 1,
        likeCount: Number(dynamic?.likeCount) || 0,
        isLiked: !!dynamic?.isLiked,
        profileImage: dynamic?.profileImage || f.profileImage,
      };
    });

    const forumUserIdRows = Array.from(
      Array.from(
        new Set([
          ...followedUsersForumIds.map((f) => f.userId),
          ...forumIds.map((f) => f.userId),
        ])
      ).map((id) => ({
        userId: id,
      }))
    );

    const forumsWithMediaAndIsFollowing = forumsWithMedia.map((forum) => ({
      ...forum,
      isFollowing: forumUserIdRows.some((b) => b.userId === forum.userId),
    }));

    const responseBody = FeedForumsResponseSchema.parse({
      data: forumsWithMediaAndIsFollowing,
      hasMore: allForums.length === limit,
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error);
  }
};

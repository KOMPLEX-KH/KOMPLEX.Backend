import { AuthenticatedRequest } from "@/types/request.js";
import { Response } from "express";
import { getResponseError, getResponseSuccess, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { forumMedias } from "@/db/drizzle/models/forum_medias.js";
import { forums } from "@/db/drizzle/models/forums.js";
import { redis } from "@/db/redis/redis.js";
import { followers, forumLikes, users } from "@/db/drizzle/schema.js";
import { meilisearch } from "@/config/meilisearch/meilisearchConfig.js";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";
import { MediaSchema } from "@/types/zod/media.schema.js";

export const ForumSearchItemSchema = z.object({
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
});

export const searchForums = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const { query, limit = "10", offset = "0" } = req.query;
    if (!query || query.trim() === "") {
      return getResponseError(res, new ResponseError("Query parameter is required", 400));
    }

    const searchResults = await meilisearch.index("forums").search(query as string, {
      limit: Number(limit),
      offset: Number(offset),
    });
    let idsFromSearch = searchResults.hits.map((hit: any) => hit.id);
    if (searchResults.hits.length === 0) {
      const followedUsersForumsId = await db
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
          desc(forums.updatedAt)
        )
        .limit(5);

      const forumIds = await db
        .select({ id: forums.id, userId: forums.userId })
        .from(forums)
        .orderBy(
          desc(
            sql`CASE WHEN DATE(${forums.updatedAt}) = CURRENT_DATE THEN 1 ELSE 0 END`
          ),
          desc(forums.updatedAt)
        )
        .offset(Number(offset))
        .limit(Number(limit));

      idsFromSearch = Array.from(
        new Set([
          ...followedUsersForumsId.map((f) => f.id),
          ...forumIds.map((f) => f.id),
        ])
      );
    }
    const cachedResults = (await redis.mGet(
      idsFromSearch.map((id) => `forums:${id}`)
    )) as (string | null)[];

    const hits: any[] = [];
    const missedIds: number[] = [];

    if (cachedResults.length > 0) {
      cachedResults.forEach((item, idx) => {
        if (item) hits.push(JSON.parse(item));
        else missedIds.push(idsFromSearch[idx]);
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
        await redis.set(`forums:${forum.id}`, JSON.stringify(forum), {
          EX: 600,
        });
      }
    }

    const allForumsMap = new Map<number, any>();
    for (const forum of [...hits, ...missedForums]) {
      allForumsMap.set(forum.id, forum);
    }

    const allForums = idsFromSearch
      .map((f) => {
        const id = typeof f === "object" ? f.id : f;
        return allForumsMap.get(id);
      })
      .filter(Boolean);

    const dynamicData = await db
      .select({
        id: forums.id,
        viewCount: forums.viewCount,
        likeCount: sql`COUNT(DISTINCT ${forumLikes.id})`,
        isLiked: sql`CASE WHEN ${forumLikes.forumId} IS NOT NULL THEN true ELSE false END`,
      })
      .from(forums)
      .leftJoin(
        forumLikes,
        and(
          eq(forumLikes.forumId, forums.id),
          eq(forumLikes.userId, Number(userId))
        )
      )
      .where(
        inArray(
          forums.id,
          idsFromSearch.map((f) => (typeof f === "object" ? f.id : f))
        )
      )
      .groupBy(forums.id, forumLikes.forumId);

    const forumsWithMedia = allForums.map((f) => {
      const dynamic = dynamicData.find((d) => d.id === f.id);
      return {
        ...f,
        viewCount: (dynamic?.viewCount ?? 0) + 1,
        likeCount: Number(dynamic?.likeCount) || 0,
        isLiked: !!dynamic?.isLiked,
      };
    });

    const responseBody = ForumSearchItemSchema.array().parse(forumsWithMedia);
    return getResponseSuccess(res, responseBody, "Forums fetched successfully", allForums.length === Number(limit));
  } catch (error) {
    return getResponseError(res, error);
  }
};

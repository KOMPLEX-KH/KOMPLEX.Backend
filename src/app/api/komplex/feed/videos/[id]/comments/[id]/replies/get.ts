import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { db } from "@/db/drizzle/index.js";
import { users, videoReplies } from "@/db/drizzle/schema.js";
import { videoReplyMedias } from "@/db/drizzle/models/video_reply_medias.js";
import { videoReplyLike } from "@/db/drizzle/models/video_reply_like.js";
import { redis } from "@/db/redis/redis.js";
import { and, desc, eq, sql } from "drizzle-orm";
import { getResponseError, getResponseSuccess } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";
import { MediaSchema } from "@/types/zod/media.schema.js";

export const FeedVideoReplyItemResponseSchema = z.object({
  id: z.number(),
  userId: z.number(),
  videoCommentId: z.number(),
  description: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  media: z.array(MediaSchema),
  username: z.string(),
  profileImage: z.string().nullable().optional(),
  likeCount: z.number(),
  isLiked: z.boolean(),
}).openapi("FeedVideoReplyItemResponseSchema");

export const getVideoReplies = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const { page } = req.query;
    const pageNumber = Number(page) || 1;
    const limit = 20;
    const offset = (pageNumber - 1) * limit;

    const cacheKey = `videoReplies:comment:${id}:page:${pageNumber}`;
    const cached = await redis.get(cacheKey);

    let cachedReplies: any[] = [];
    if (cached) {
      cachedReplies = JSON.parse(cached);
    }

    const dynamicData = await db
      .select({
        id: videoReplies.id,
        likeCount: sql`COUNT(DISTINCT ${videoReplyLike.videoReplyId})`,
        isLiked: sql`CASE WHEN ${videoReplyLike.videoReplyId} IS NOT NULL THEN true ELSE false END`,
        profileImage: users.profileImage,
      })
      .from(videoReplies)
      .leftJoin(
        videoReplyLike,
        and(
          eq(videoReplyLike.videoReplyId, videoReplies.id),
          eq(videoReplyLike.userId, userId)
        )
      )
      .leftJoin(users, eq(users.id, videoReplies.userId))
      .where(eq(videoReplies.videoCommentId, Number(id)))
      .groupBy(videoReplies.id, videoReplyLike.videoReplyId, users.profileImage)
      .offset(offset)
      .limit(limit);

    if (!cachedReplies.length) {
      const replyRows = await db
        .select({
          id: videoReplies.id,
          userId: videoReplies.userId,
          videoCommentId: videoReplies.videoCommentId,
          description: videoReplies.description,
          createdAt: videoReplies.createdAt,
          updatedAt: videoReplies.updatedAt,
          mediaUrl: videoReplyMedias.url,
          mediaType: videoReplyMedias.mediaType,
          username: sql`${users.firstName} || ' ' || ${users.lastName}`,
          profileImage: users.profileImage,
        })
        .from(videoReplies)
        .leftJoin(
          videoReplyMedias,
          eq(videoReplies.id, videoReplyMedias.videoReplyId)
        )
        .leftJoin(users, eq(videoReplies.userId, users.id))
        .leftJoin(
          videoReplyLike,
          eq(videoReplies.id, videoReplyLike.videoReplyId)
        )
        .where(eq(videoReplies.videoCommentId, Number(id)))
        .groupBy(
          videoReplies.id,
          videoReplies.userId,
          videoReplies.videoCommentId,
          videoReplies.description,
          videoReplies.createdAt,
          videoReplies.updatedAt,
          videoReplyMedias.url,
          videoReplyMedias.mediaType,
          users.firstName,
          users.lastName,
          users.profileImage
        )
        .orderBy(
          desc(sql`COUNT(DISTINCT ${videoReplyLike.id})`),
          desc(
            sql`CASE WHEN DATE(${videoReplies.updatedAt}) = CURRENT_DATE THEN 1 ELSE 0 END`
          ),
          desc(videoReplies.updatedAt)
        )
        .offset(offset)
        .limit(limit);

      cachedReplies = Object.values(
        replyRows.reduce((acc, reply) => {
          if (!acc[reply.id]) {
            acc[reply.id] = {
              id: reply.id,
              userId: reply.userId,
              videoCommentId: reply.videoCommentId,
              description: reply.description,
              createdAt: reply.createdAt,
              updatedAt: reply.updatedAt,
              media: [] as { url: string; type: string }[],
              username: reply.username,
              profileImage: reply.profileImage,
            };
          }
          if (reply.mediaUrl) {
            acc[reply.id].media.push({
              url: reply.mediaUrl,
              type: reply.mediaType,
            });
          }
          return acc;
        }, {} as { [key: number]: any })
      );

      // Save to redis after schema parsing and serializing for consistency
      // (Add placeholder for likeCount/isLiked, those will always be overwritten after mapping below)
      const parsedCache = FeedVideoReplyItemResponseSchema.array().parse(
        cachedReplies.map((r) => ({
          ...r,
          likeCount: 0,
          isLiked: false,
        })),
      );
      await redis.set(cacheKey, JSON.stringify(parsedCache), { EX: 60 });
    }

    // Compose final replies with dynamic like info, using zod to validate each
    const repliesWithMedia = cachedReplies.map((r) => {
      const dynamic = dynamicData.find((d) => d.id === r.id);
      return FeedVideoReplyItemResponseSchema.parse({
        ...r,
        likeCount: Number(dynamic?.likeCount) || 0,
        isLiked: !!dynamic?.isLiked,
        profileImage: dynamic?.profileImage || r.profileImage || null,
      });
    });

    const responseBody = FeedVideoReplyItemResponseSchema.array().parse(repliesWithMedia);

    return getResponseSuccess(res, responseBody, "Replies fetched successfully", repliesWithMedia.length === limit);
  } catch (error) {
    return getResponseError(res, error);
  }
};


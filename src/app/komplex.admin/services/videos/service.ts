import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  videoComments,
  videoLikes,
  videos,
  userSavedVideos,
  users,
  videoReplies,
} from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const getAllVideos = async (page: number = 1) => {
  try {
    const limit = 20;
    const offset = (page - 1) * limit;

    const videosData = await db
      .select()
      .from(videos)
      .groupBy(videos.id)
      .limit(limit)
      .offset(offset);

    const cachedResults = (await redis.mGet(
      videosData.map((v) => `videos:${v.id}`)
    )) as (string | null)[];

    const hits: any[] = [];
    const missedIds: number[] = [];

    if (cachedResults.length > 0) {
      cachedResults.forEach((item, idx) => {
        if (item) hits.push(JSON.parse(item));
        else missedIds.push(videosData[idx].id);
      });
    }

    let missedVideos: any[] = [];
    if (missedIds.length > 0) {
      const videoRows = await db
        .select({
          id: videos.id,
          userId: videos.userId,
          title: videos.title,
          description: videos.description,
          type: videos.type,
          topic: videos.topic,
          duration: videos.duration,
          videoUrl: videos.videoUrl,
          thumbnailUrl: videos.thumbnailUrl,
          createdAt: videos.createdAt,
          updatedAt: videos.updatedAt,
          username: sql`${users.firstName} || ' ' || ${users.lastName}`,
          viewCount: videos.viewCount,
        })
        .from(videos)
        .leftJoin(users, eq(videos.userId, users.id))
        .where(inArray(videos.id, missedIds));

      for (const video of videoRows) {
        const formatted = {
          id: video.id,
          userId: video.userId,
          title: video.title,
          description: video.description,
          type: video.type,
          topic: video.topic,
          duration: video.duration,
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl,
          createdAt: video.createdAt,
          updatedAt: video.updatedAt,
          username: video.username,
          viewCount: video.viewCount,
        };
        missedVideos.push(formatted);
        await redis.set(`videos:${video.id}`, JSON.stringify(formatted), {
          EX: 600,
        });
      }
    }

    const allVideosMap = new Map<number, any>();
    for (const video of [...hits, ...missedVideos])
      allVideosMap.set(video.id, video);
    const allVideos = videosData.map((v) => allVideosMap.get(v.id));

    const videosWithStats = await Promise.all(
      allVideos.map(async (video) => {
        const likeCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(videoLikes)
          .where(eq(videoLikes.videoId, video.id))
          .groupBy(videoLikes.videoId, videoLikes.userId);

        const commentCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(videoComments)
          .where(eq(videoComments.videoId, video.id))
          .groupBy(videoComments.videoId, videoComments.userId);

        const replyCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(videoReplies)
          .leftJoin(
            videoComments,
            eq(videoComments.id, videoReplies.videoCommentId)
          )
          .where(eq(videoComments.videoId, video.id))
          .groupBy(videoComments.videoId, videoComments.userId);

        const saveCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(userSavedVideos)
          .where(eq(userSavedVideos.videoId, video.id))
          .groupBy(userSavedVideos.videoId, userSavedVideos.userId);

        let username;
        if (video.userId) {
          const user = await db
            .select()
            .from(users)
            .where(eq(users.id, video.userId))
            .groupBy(users.id, users.firstName, users.lastName);

          username = user[0]?.firstName + " " + user[0]?.lastName;
        }

        const [viewCount] = await db
          .select({ viewCount: videos.viewCount })
          .from(videos)
          .where(eq(videos.id, video.id))
          .groupBy(videos.id);

        return {
          id: video.id,
          title: video.title,
          description: video.description,
          viewCount: Number(viewCount.viewCount),
          duration: Number(video.duration),
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl,
          likeCount: Number(likeCount[0]?.count || 0),
          commentCount: Number(commentCount[0]?.count || 0),
          replyCount: Number(replyCount[0]?.count || 0),
          saveCount: Number(saveCount[0]?.count || 0),
          username: username,
          createdAt: video.createdAt,
          updatedAt: video.updatedAt,
        };
      })
    );

    return videosWithStats;
  } catch (error: any) {
    throw new Error(`Failed to get videos: ${error.message}`);
  }
};

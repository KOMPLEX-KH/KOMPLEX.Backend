import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";
import {
  users,
  news,
  videos,
  exercises,
  forums,
  forumComments,
  forumReplies,
  videoComments,
  videoReplies,
  userExerciseHistory,
  userVideoHistory,
  videoLikes,
  forumLikes,
} from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const cacheKey = `dashboard:totalUsers`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const totalUsers = Number(totalUsersResult[0]?.count || 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsersResult = await db
      .select({ count: sql<number>`count(distinct ${users.id})` })
      .from(users)
      .leftJoin(
        userExerciseHistory,
        sql`${users.id} = ${userExerciseHistory.userId}`
      )
      .leftJoin(userVideoHistory, sql`${users.id} = ${userVideoHistory.userId}`)
      .leftJoin(forumComments, sql`${users.id} = ${forumComments.userId}`)
      .leftJoin(videoComments, sql`${users.id} = ${videoComments.userId}`)
      .where(
        sql`(${userExerciseHistory.createdAt} > ${thirtyDaysAgo} OR 
             ${userVideoHistory.createdAt} > ${thirtyDaysAgo} OR 
             ${forumComments.createdAt} > ${thirtyDaysAgo} OR 
             ${videoComments.createdAt} > ${thirtyDaysAgo})`
      );
    const activeUsers = Number(activeUsersResult[0]?.count || 0);

    const totalNewsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(news);
    const totalNews = Number(totalNewsResult[0]?.count || 0);

    const totalVideosResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(videos);
    const totalVideos = Number(totalVideosResult[0]?.count || 0);

    const totalExercisesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(exercises);
    const totalExercises = Number(totalExercisesResult[0]?.count || 0);

    const totalForumsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(forums);
    const totalForums = Number(totalForumsResult[0]?.count || 0);

    const totalContent = totalNews + totalVideos + totalExercises + totalForums;

    const totalViewsResult = await db
      .select({
        newsViews: sql<number>`COALESCE(SUM(${news.viewCount}), 0)`,
        videoViews: sql<number>`COALESCE(SUM(${videos.viewCount}), 0)`,
        forumViews: sql<number>`COALESCE(SUM(${forums.viewCount}), 0)`,
      })
      .from(news)
      .leftJoin(videos, sql`1=1`)
      .leftJoin(forums, sql`1=1`);

    const totalViews =
      Number(totalViewsResult[0]?.newsViews || 0) +
      Number(totalViewsResult[0]?.videoViews || 0) +
      Number(totalViewsResult[0]?.forumViews || 0);

    const totalLikesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(videoLikes);
    const videoLikesCount = Number(totalLikesResult[0]?.count || 0);

    const totalForumLikesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(forumLikes);
    const forumLikesCount = Number(totalForumLikesResult[0]?.count || 0);
    const totalLikes = videoLikesCount + forumLikesCount;

    const totalCommentsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(forumComments);
    const forumCommentsCount = Number(totalCommentsResult[0]?.count || 0);

    const totalVideoCommentsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(videoComments);
    const videoCommentsCount = Number(totalVideoCommentsResult[0]?.count || 0);
    const totalComments = forumCommentsCount + videoCommentsCount;

    const totalRepliesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(forumReplies);
    const forumRepliesCount = Number(totalRepliesResult[0]?.count || 0);

    const totalVideoRepliesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(videoReplies);
    const videoRepliesCount = Number(totalVideoRepliesResult[0]?.count || 0);
    const totalReplies = forumRepliesCount + videoRepliesCount;

    const completedExercisesResult = await db
      .select({
        count: sql<number>`count(distinct ${userExerciseHistory.exerciseId})`,
      })
      .from(userExerciseHistory);
    const completedExercises = Number(completedExercisesResult[0]?.count || 0);
    const completionRate =
      totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

    const recentActivities: Array<{
      type: string;
      description: string;
    }> = [];

    const recentUsers = await db
      .select({
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(sql`${users.createdAt} DESC`)
      .limit(3);

    recentUsers.forEach((user) => {
      if (user.createdAt) {
        recentActivities.push({
          type: "user_registered",
          description: `${user.firstName} ${user.lastName} (${user.email})`,
        });
      }
    });

    const recentVideos = await db
      .select({
        title: videos.title,
        createdAt: videos.createdAt,
      })
      .from(videos)
      .orderBy(sql`${videos.createdAt} DESC`)
      .limit(3);

    recentVideos.forEach((video) => {
      if (video.createdAt) {
        recentActivities.push({
          type: "video_uploaded",
          description: `"${video.title}" uploaded`,
        });
      }
    });

    const recentNews = await db
      .select({
        title: news.title,
        createdAt: news.createdAt,
      })
      .from(news)
      .orderBy(sql`${news.createdAt} DESC`)
      .limit(3);

    recentNews.forEach((newsItem) => {
      if (newsItem.createdAt) {
        recentActivities.push({
          type: "news_posted",
          description: `"${newsItem.title}" posted`,
        });
      }
    });

    const recentForums = await db
      .select({
        title: forums.title,
        createdAt: forums.createdAt,
      })
      .from(forums)
      .orderBy(sql`${forums.createdAt} DESC`)
      .limit(3);

    recentForums.forEach((forum) => {
      if (forum.createdAt) {
        recentActivities.push({
          type: "forum_posted",
          description: `"${forum.title}" posted`,
        });
      }
    });

    const recentExerciseCompletions = await db
      .select({
        score: userExerciseHistory.score,
        exerciseId: userExerciseHistory.exerciseId,
        createdAt: userExerciseHistory.createdAt,
      })
      .from(userExerciseHistory)
      .orderBy(sql`${userExerciseHistory.createdAt} DESC`)
      .limit(3);

    recentExerciseCompletions.forEach((completion) => {
      if (completion.createdAt) {
        recentActivities.push({
          type: "exercise_completed",
          description: `Exercise ${completion.exerciseId} completed (Score: ${completion.score})`,
        });
      }
    });

    const sortedActivities = recentActivities.slice(0, 10);

    const dashboardData = {
      totalUsers,
      activeUsers,
      totalContent,
      completionRate: Math.round(completionRate * 100) / 100,
      totalNews,
      totalVideos,
      totalExercises,
      totalForums,
      totalViews,
      totalLikes,
      totalComments,
      totalReplies,
      recentActivities: sortedActivities,
    };
    await redis.set(cacheKey, JSON.stringify(dashboardData), {
      EX: 60 * 60 * 24,
    });

    return res.status(200).json(dashboardData);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

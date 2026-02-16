import { db } from "@/db/drizzle/index.js";
import { desc, eq } from "drizzle-orm";
import { news, exercises, forums, videos } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { ResponseError, getResponseError } from "@/utils/response.js";
import { AuthenticatedRequest } from "@/types/request.js";
import { Response } from "express";
import { z } from "@/config/openapi/openapi.js";

const DashboardStatsSchema = z.object({
  numOfNews: z.number(),
  numOfVideos: z.number(),
  numOfExercises: z.number(),
  numOfForums: z.number(),
});

const DashboardActivityItemSchema = z.object({
  title: z.string(),
  createdAt: z.date(),
  contentType: z.enum(["news", "video", "exercise", "forum"]),
});

export const MeDashboardResponseSchema = z
  .object({
    dashboardData: DashboardStatsSchema,
    recentActivities: z.array(DashboardActivityItemSchema),
  })
  .openapi("MeDashboardResponse");

export const getMeDashboard = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const cacheKey = `dashboardData:${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = MeDashboardResponseSchema.parse(JSON.parse(cached));
      return res.status(200).json(parsed);
    }

    const dashboardData = {
      numOfNews: 0,
      numOfVideos: 0,
      numOfExercises: 0,
      numOfForums: 0,
    };

    const numOfNews = await db
      .select()
      .from(news)
      .where(eq(news.userId, Number(userId)));
    const numOfVids = await db
      .select()
      .from(videos)
      .where(eq(videos.userId, Number(userId)));
    const numOfExercisesCompleted = await db
      .select()
      .from(exercises)
      .where(eq(exercises.userId, Number(userId)));
    const numOfForumsPosted = await db
      .select()
      .from(forums)
      .where(eq(forums.userId, Number(userId)));

    dashboardData.numOfNews = numOfNews.length;
    dashboardData.numOfVideos = numOfVids.length;
    dashboardData.numOfExercises = numOfExercisesCompleted.length;
    dashboardData.numOfForums = numOfForumsPosted.length;

    const recentNews = await db
      .select({
        title: news.title,
        createdAt: news.createdAt,
      })
      .from(news)
      .where(eq(news.userId, Number(userId)))
      .orderBy(desc(news.createdAt))
      .limit(5);

    const recentVideos = await db
      .select({
        title: videos.title,
        createdAt: videos.createdAt,
      })
      .from(videos)
      .where(eq(videos.userId, Number(userId)))
      .orderBy(desc(videos.createdAt))
      .limit(5);

    const recentExercises = await db
      .select({
        title: exercises.title,
        createdAt: exercises.createdAt,
      })
      .from(exercises)
      .where(eq(exercises.userId, Number(userId)))
      .orderBy(desc(exercises.createdAt))
      .limit(5);

    const recentForums = await db
      .select({
        title: forums.title,
        createdAt: forums.createdAt,
      })
      .from(forums)
      .where(eq(forums.userId, Number(userId)))
      .orderBy(desc(forums.createdAt))
      .limit(5);

    const recentActivities = [
      ...recentNews.map((newsItem) => ({ ...newsItem, contentType: "news" as const })),
      ...recentVideos.map((video) => ({ ...video, contentType: "video" as const })),
      ...recentExercises.map((exercise) => ({
        ...exercise,
        contentType: "exercise" as const,
      })),
      ...recentForums.map((forum) => ({ ...forum, contentType: "forum" as const })),
    ];

    const sortedRecentActivities = recentActivities
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);

    const responseData = {
      dashboardData,
      recentActivities: sortedRecentActivities,
    };

    const parsed = MeDashboardResponseSchema.parse(responseData);
    await redis.set(cacheKey, JSON.stringify(parsed), { EX: 60 * 60 * 24 });

    return res.status(200).json(parsed);
  } catch (error) {
    return getResponseError(res, error);
  }
};

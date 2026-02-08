import { db } from "@/db/index.js";
import { desc, eq } from "drizzle-orm";
import { news, exercises, forums, videos } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";
import { ResponseError } from "@/utils/responseError.js"; 
export const getUserContentDashboard = async (userId: number) => {
  // number of news, number of vids, number of excercises compoleted, number of forums posted
  try {
    const cacheKey = `dashboardData:${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return { data: JSON.parse(cached) };
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
  
    // get recent activities, so we have to get the recently added excercise, news, forums that is by this user
  
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
  
    // Add contentType to each item and combine into single array
    const recentActivities = [
      ...recentNews.map((newsItem) => ({ ...newsItem, contentType: "news" })),
      ...recentVideos.map((video) => ({ ...video, contentType: "video" })),
      ...recentExercises.map((exercise) => ({
        ...exercise,
        contentType: "exercise",
      })),
      ...recentForums.map((forum) => ({ ...forum, contentType: "forum" })),
    ];
  
    // Sort by createdAt (most recent first) and take top 5
    const sortedRecentActivities = recentActivities
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
    await redis.set(
      cacheKey,
      JSON.stringify({ dashboardData, recentActivities: sortedRecentActivities }),
      {
        EX: 60 * 60 * 24,
      }
    );
    return { data: { dashboardData, recentActivities: sortedRecentActivities } };
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};

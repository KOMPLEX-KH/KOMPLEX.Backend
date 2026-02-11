import { db } from "@/db/index.js";
import { topics, users, videos } from "@/db/schema.js";
import { userAiTabs } from "@/db/models/user_ai_tabs.js";
import { eq } from "drizzle-orm";
import { ResponseError } from "@/utils/responseError.js";

export const getLastAccessedService = async (userId: number) => {
  try {
    const lastAccessed = await db
      .select({
        lastTopicId: users.lastTopicId,
        lastTopicName: topics.name,
        lastVideoId: users.lastVideoId,
        lastVideoTitle: videos.title,
        lastAiTabId: users.lastAiTabId,
        lastAiTabName: userAiTabs.tabName,
      })
      .from(users)
      .leftJoin(topics, eq(users.lastTopicId, topics.id))
      .leftJoin(videos, eq(users.lastVideoId, videos.id))
      .leftJoin(userAiTabs, eq(users.lastAiTabId, userAiTabs.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!lastAccessed || lastAccessed.length === 0) {
      return { data: null };
    }

    return {
      data: {
        lastTopic: lastAccessed[0].lastTopicId
          ? {
              id: lastAccessed[0].lastTopicId,
              name: lastAccessed[0].lastTopicName,
            }
          : null,
        lastVideo: lastAccessed[0].lastVideoId
          ? {
              id: lastAccessed[0].lastVideoId,
              title: lastAccessed[0].lastVideoTitle,
            }
          : null,
        lastAiTab: lastAccessed[0].lastAiTabId
          ? {
              id: lastAccessed[0].lastAiTabId,
              name: lastAccessed[0].lastAiTabName,
            }
          : null,
      },
    };
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};

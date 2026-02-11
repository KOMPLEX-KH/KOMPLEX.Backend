import { AuthenticatedRequest } from "@/types/request.js";
import { Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { topics, users, videos } from "@/db/schema.js";
import { userAiTabs } from "@/db/models/user_ai_tabs.js";
import { eq } from "drizzle-orm";

export const getLastAccessed = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    if (!userId || userId === 0) {
      return getResponseError(res, new ResponseError("User ID is required", 400));
    }

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
      return res.status(200).json({ data: null });
    }

    return res.status(200).json({
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
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};

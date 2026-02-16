import { AuthenticatedRequest } from "@/types/request.js";
import { Response } from "express";
import { getResponseError, getResponseSuccess, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { topics, users, videos } from "@/db/drizzle/schema.js";
import { userAiTabs } from "@/db/drizzle/models/user_ai_tabs.js";
import { eq } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

const LastAccessedItemSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  title: z.string().optional(),
}).openapi("LastAccessedItemSchema");

export const MeLastAccessedResponseSchema = z
  .object({
    lastTopic: LastAccessedItemSchema.nullable(),
    lastVideo: LastAccessedItemSchema.nullable(),
    lastAiTab: LastAccessedItemSchema.nullable(),
  })
  .nullable()
  .openapi("MeLastAccessedResponseSchema");

export const getLastAccessed = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    if (!userId) {
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
      const emptyBody = MeLastAccessedResponseSchema.parse(null);
      return getResponseSuccess(res, emptyBody, "No last accessed content found", false);
    }

    const responseBody = MeLastAccessedResponseSchema.parse({
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
    });

    return getResponseSuccess(res, responseBody);
  } catch (error) {
    return getResponseError(res, error);
  }
};

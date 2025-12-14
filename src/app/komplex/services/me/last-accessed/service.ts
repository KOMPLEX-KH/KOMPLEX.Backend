import { db } from "@/db/index.js";
import { topics, users, videos } from "@/db/schema.js";
import { eq } from "drizzle-orm";

export const getLastAccessedService = async (userId: number) => {
  try {
    const lastAccessed = await db
      .select({
        lastTopicId: users.lastTopicId,
        lastVideoId: users.lastVideoId,
        lastAiTabId: users.lastAiTabId,
      })
      .from(users)
      .where(eq(users.id, userId));
    return { data: lastAccessed };
  } catch (error) {
    throw new Error("Failed to get last accessed");
  }
};

import { db } from "@/db/index.js";
import { and, eq } from "drizzle-orm";
import { users } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const handleLogin = async (uid: string) => {
  const cacheKey = `users:${uid}`;

  if (!uid) {
    throw new Error("UID is required");
  }

  const cacheData = await redis.get(cacheKey);
  const parsedCache = cacheData ? JSON.parse(cacheData) : null;

  if (parsedCache) {
    return parsedCache;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.uid, uid), eq(users.isAdmin, true)));

  if (!user) {
    throw new Error("Invalid credentials");
  }

  return user;
};

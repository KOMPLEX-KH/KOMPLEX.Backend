import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { users } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const createAdmin = async (
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  uid: string
) => {
  try {
    const result = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email,
        phone,
        uid,
        isAdmin: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const cacheKey = `users:${result[0].id}`;
    await redis.set(cacheKey, JSON.stringify(result[0]), { EX: 600 });

    return result;
  } catch (error) {
    throw new Error(`Failed to create admin: ${(error as Error).message}`);
  }
};

export const updateAdmin = async (
  id: number,
  firstName: string,
  lastName: string,
  email: string
) => {
  try {
    const result = await db
      .update(users)
      .set({ firstName, lastName, email })
      .where(eq(users.id, id))
      .returning();

    const cacheKey = `users:${result[0].id}`;
    await redis.set(cacheKey, JSON.stringify(result[0]), { EX: 600 });

    return result;
  } catch (error) {
    throw new Error(`Failed to update admin: ${(error as Error).message}`);
  }
};

export const deleteAdmin = async (id: number) => {
  try {
    const result = await db.delete(users).where(eq(users.id, id)).returning();

    await redis.del(`users:${id}`);

    return result;
  } catch (error) {
    throw new Error(`Failed to delete admin: ${(error as Error).message}`);
  }
};

import { Request, Response } from "express";
import { getResponseError } from "@/utils/response.js";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { users } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { z } from "@/config/openapi/openapi.js";

export const AdminGetAdminsQuerySchema = z
  .object({
    page: z.string().optional(),
  })
  .openapi("AdminGetAdminsQuery");

export const AdminGetAdminsResponseSchema = z
  .array(z.any())
  .openapi("AdminGetAdminsResponse");

export const getAllAdmins = async (req: Request, res: Response) => {
  try {
    const { page } = await AdminGetAdminsQuerySchema.parseAsync(req.query);
    const pageNumber = Number(page) || 1;
    const limit = 100;
    const offset = (pageNumber - 1) * limit;

    const result = await db
      .select({ userId: users.id })
      .from(users)
      .where(eq(users.isAdmin, true))
      .limit(limit)
      .offset(offset);

    const adminKeys = result.map((v) => `users:${v.userId}`);
    const cachedResults = (
      adminKeys.length
        ? ((await redis.mGet(adminKeys)) as (string | null)[])
        : []
    ) as (string | null)[];

    const hits: any[] = [];
    const missedIds: number[] = [];

    if (cachedResults.length > 0) {
      cachedResults.forEach((item, idx) => {
        if (item) hits.push(JSON.parse(item));
        else missedIds.push(result[idx].userId);
      });
    }

    let missedUsers: any[] = [];
    if (missedIds.length > 0) {
      const userRows = await db
        .select()
        .from(users)
        .where(inArray(users.id, missedIds));

      for (const user of userRows) {
        await redis.set(`users:${user.id}`, JSON.stringify(user), {
          EX: 600,
        });
        missedUsers.push(user);
      }
    }

    const allAdminsMap = new Map<number, any>();
    hits.forEach((user) => allAdminsMap.set(user.id, user));
    missedUsers.forEach((user) => allAdminsMap.set(user.id, user));
    const allAdmins = result.map((r) => allAdminsMap.get(r.userId));

    const responseBody = AdminGetAdminsResponseSchema.parse(allAdmins);

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

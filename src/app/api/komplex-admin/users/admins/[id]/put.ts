import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { users } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";
import { z } from "@/config/openapi/openapi.js";

export const AdminUpdateAdminParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("AdminUpdateAdminParams");

export const AdminUpdateAdminBodySchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
  })
  .openapi("AdminUpdateAdminBody");

export const AdminUpdateAdminResponseSchema = z
  .any()
  .openapi("AdminUpdateAdminResponse");

export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = await AdminUpdateAdminParamsSchema.parseAsync(req.params);
    const { firstName, lastName, email } =
      await AdminUpdateAdminBodySchema.parseAsync(req.body);

    const result = await db
      .update(users)
      .set({ firstName, lastName, email, updatedAt: new Date() })
      .where(eq(users.id, Number(id)))
      .returning();

    const rows = result as any[];
    const updatedUser = rows[0];

    const cacheKey = `users:${updatedUser.id}`;
    await redis.set(cacheKey, JSON.stringify(updatedUser), { EX: 600 });

    const responseBody = AdminUpdateAdminResponseSchema.parse(updatedUser);

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

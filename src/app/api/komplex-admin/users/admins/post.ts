import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { users } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";
import { z } from "@/config/openapi/openapi.js";

export const AdminCreateAdminBodySchema = z
  .object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    uid: z.string(),
  })
  .openapi("AdminCreateAdminBody");

export const AdminCreateAdminResponseSchema = z
  .any()
  .openapi("AdminCreateAdminResponse");

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, uid } =
      await AdminCreateAdminBodySchema.parseAsync(req.body);

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

    const rows = result as any[];
    const createdUser = rows[0];

    const cacheKey = `users:${createdUser.id}`;
    await redis.set(cacheKey, JSON.stringify(createdUser), { EX: 600 });

    const responseBody = AdminCreateAdminResponseSchema.parse(createdUser);

    return res.status(201).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

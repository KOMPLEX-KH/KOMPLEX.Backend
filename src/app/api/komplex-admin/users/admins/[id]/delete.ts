import { Request, Response } from "express";
import { getResponseError } from "@/utils/response.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { users } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { z } from "@/config/openapi/openapi.js";

export const AdminDeleteAdminParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("AdminDeleteAdminParams");

export const AdminDeleteAdminResponseSchema = z
  .array(z.any())
  .openapi("AdminDeleteAdminResponse");

export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = await AdminDeleteAdminParamsSchema.parseAsync(req.params);

    const result = await db
      .delete(users)
      .where(eq(users.id, Number(id)))
      .returning();

    await redis.del(`users:${id}`);

    const responseBody = AdminDeleteAdminResponseSchema.parse(result);

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

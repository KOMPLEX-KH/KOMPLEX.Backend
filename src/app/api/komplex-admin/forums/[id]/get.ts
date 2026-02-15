import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { forums } from "@/db/drizzle/schema.js";
import { z } from "@/config/openapi/openapi.js";

export const AdminGetForumByIdParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("AdminGetForumByIdParams");

export const AdminGetForumByIdResponseSchema = z
  .any()
  .openapi("AdminGetForumByIdResponse");

export const getForumById = async (req: Request, res: Response) => {
  try {
    const { id } = await AdminGetForumByIdParamsSchema.parseAsync(req.params);

    const forum = await db
      .select()
      .from(forums)
      .where(eq(forums.id, Number(id)))
      .limit(1);

    if (!forum || forum.length === 0 || !forum[0]) {
      throw new ResponseError("Forum not found", 404);
    }

    await db
      .update(forums)
      .set({
        viewCount: (forum[0]?.viewCount ?? 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(forums.id, Number(id)))
      .returning();

    const responseBody = AdminGetForumByIdResponseSchema.parse(forum[0]);

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

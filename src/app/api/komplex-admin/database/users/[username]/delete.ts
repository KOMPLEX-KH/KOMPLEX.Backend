import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const DeleteUserParamsSchema = z.object({
  username: z.string(),
}).openapi("DeleteUserParams");

export const DeleteUserResponseSchema = z.object({
  message: z.string(),
}).openapi("DeleteUserResponse");

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { username } = await DeleteUserParamsSchema.parseAsync(req.params);

    await db.execute(sql`DROP USER ${sql.identifier(username)}`);

    return res.status(200).json(DeleteUserResponseSchema.parse({ message: "User deleted successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


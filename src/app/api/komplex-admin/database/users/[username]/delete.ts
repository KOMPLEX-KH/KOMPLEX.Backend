import { Request, Response } from "express";
import { sendResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
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
    return sendResponseError(res, error as Error);
  }
};


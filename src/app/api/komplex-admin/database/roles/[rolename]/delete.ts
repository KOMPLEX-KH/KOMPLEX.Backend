import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { sql } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const DeleteRoleParamsSchema = z.object({
  rolename: z.string(),
}).openapi("DeleteRoleParams");

export const DeleteRoleResponseSchema = z.object({
  message: z.string(),
}).openapi("DeleteRoleResponse");

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { rolename } = await DeleteRoleParamsSchema.parseAsync(req.params);
    if (!rolename) {
      throw new ResponseError("Missing required fields", 400);
    }

    await db.execute(sql`DROP ROLE ${sql.identifier(rolename)}`);

    return res.status(200).json(DeleteRoleResponseSchema.parse({ message: "Role deleted successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { sql } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const UpdateRoleNameParamsSchema = z.object({
  oldRole: z.string(),
}).openapi("UpdateRoleNameParams");

export const UpdateRoleNameBodySchema = z.object({
  newRole: z.string(),
}).openapi("UpdateRoleNameBody");

export const UpdateRoleNameResponseSchema = z.object({
  message: z.string(),
}).openapi("UpdateRoleNameResponse");

export const updateRoleName = async (req: Request, res: Response) => {
  try {
    const { oldRole } = await UpdateRoleNameParamsSchema.parseAsync(req.params);
    const { newRole } = await UpdateRoleNameBodySchema.parseAsync(req.body);

    if (!oldRole || !newRole) {
      throw new ResponseError("Missing required fields", 400);
    }

    await db.execute(
      sql`ALTER ROLE ${sql.identifier(oldRole)} RENAME TO ${sql.identifier(
        newRole
      )}`
    );

    return res.status(200).json(UpdateRoleNameResponseSchema.parse({ message: "Role updated successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const UpdateRolePrivilegesParamsSchema = z.object({
  rolename: z.string(),
}).openapi("UpdateRolePrivilegesParams");

export const UpdateRolePrivilegesBodySchema = z.object({
  table: z.string(),
  updatedPrivileges: z.array(z.string()),
}).openapi("UpdateRolePrivilegesBody");

export const UpdateRolePrivilegesResponseSchema = z.object({
  message: z.string(),
}).openapi("UpdateRolePrivilegesResponse");

export const updateRolePrivileges = async (req: Request, res: Response) => {
  try {
    const { rolename } = await UpdateRolePrivilegesParamsSchema.parseAsync(req.params);
    const { table, updatedPrivileges } = await UpdateRolePrivilegesBodySchema.parseAsync(req.body);

    if (!rolename || !table) {
      throw new ResponseError("Missing required fields", 400);
    }

    await db.execute(
      sql`REVOKE ALL ON TABLE ${sql.identifier(table)} FROM ${sql.identifier(
        rolename
      )}`
    );

    for (const privilege of updatedPrivileges || []) {
      await db.execute(
        sql`GRANT ${sql.identifier(privilege)} ON TABLE ${sql.identifier(
          table
        )} TO ${sql.identifier(rolename)}`
      );
    }

    return res
      .status(200)
      .json(UpdateRolePrivilegesResponseSchema.parse({ message: "Privileges of role updated successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


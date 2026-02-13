import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const UpdateRoleTableAccessParamsSchema = z.object({
  rolename: z.string(),
}).openapi("UpdateRoleTableAccessParams");

export const UpdateRoleTableAccessBodySchema = z.object({
  updatedTables: z.array(z.string()),
}).openapi("UpdateRoleTableAccessBody");

export const UpdateRoleTableAccessResponseSchema = z.object({
  message: z.string(),
}).openapi("UpdateRoleTableAccessResponse");

export const updateRoleTableAccess = async (req: Request, res: Response) => {
  try {
    const { rolename } = await UpdateRoleTableAccessParamsSchema.parseAsync(req.params);
    const { updatedTables } = await UpdateRoleTableAccessBodySchema.parseAsync(req.body);

    if (!rolename || !Array.isArray(updatedTables)) {
      throw new ResponseError("Missing required fields", 400);
    }

    const currentTablesResult = await db.execute(
      sql`SELECT DISTINCT table_name FROM information_schema.role_table_grants WHERE grantee = ${rolename}`
    );

    const currentTablesNames = currentTablesResult.rows.map(
      (table: any) => table.table_name
    );

    if (updatedTables.length > currentTablesNames.length) {
      const addedTables = updatedTables.filter(
        (table: string) => !currentTablesNames.includes(table)
      );

      for (const table of addedTables) {
        await db.execute(
          sql`GRANT SELECT ON TABLE ${sql.identifier(
            table
          )} TO ${sql.identifier(rolename)}`
        );
      }

      return res
        .status(200)
        .json(UpdateRoleTableAccessResponseSchema.parse({ message: "Table access of role updated successfully" }));
    }

    const removedTables = currentTablesNames.filter(
      (table: string) => !updatedTables.includes(table)
    );

    for (const table of removedTables) {
      await db.execute(
        sql`REVOKE ALL ON TABLE ${sql.identifier(table)} FROM ${sql.identifier(
          rolename
        )}`
      );
    }

    return res
      .status(200)
      .json(UpdateRoleTableAccessResponseSchema.parse({ message: "Table access of role updated successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { sql } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const CreateRoleBodySchema = z.object({
  role: z.string(),
  tableAndPrivileges: z.array(z.object({
    name: z.string(),
    privileges: z.array(z.string()),
  })),
}).openapi("CreateRoleBody");

export const CreateRoleResponseSchema = z.object({
  message: z.string(),
}).openapi("CreateRoleResponse");

export const CreateRole = async (req: Request, res: Response) => {
  try {
    const {
      role,
      tableAndPrivileges,
    }: { role: string; tableAndPrivileges: Array<{ name: string; privileges: string[] }> } = await CreateRoleBodySchema.parseAsync(req.body);

    if (!role || !tableAndPrivileges) {
      throw new ResponseError("Missing required fields", 400);
    }

    await db.execute(sql`CREATE ROLE ${sql.identifier(role)}`);

    for (const table of tableAndPrivileges || []) {
      for (const privilege of table.privileges || []) {
        await db.execute(
          sql`GRANT ${sql.identifier(privilege)} ON TABLE ${sql.identifier(
            table.name
          )} TO ${sql.identifier(role)}`
        );
      }
    }

    return res.status(201).json(CreateRoleResponseSchema.parse({ message: "Role created successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


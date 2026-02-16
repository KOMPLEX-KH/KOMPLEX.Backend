import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { sql } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const UpdateUserParamsSchema = z.object({
  username: z.string(),
}).openapi("UpdateUserParams");

export const UpdateUserBodySchema = z.object({
  username: z.string(),
  password: z.string().optional(),
  role: z.string().optional(),
}).openapi("UpdateUserBody");

export const UpdateUserResponseSchema = z.object({
  message: z.string(),
}).openapi("UpdateUserResponse");

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { username } = await UpdateUserParamsSchema.parseAsync(req.params);
    const { username: newUsername, password, role } = await UpdateUserBodySchema.parseAsync(req.body);

    if (password !== undefined && password !== "") {
      await db.execute(
        sql`ALTER USER ${sql.identifier(username)} WITH PASSWORD ${password}`
      );
    }

    if (newUsername !== undefined && newUsername !== "" && newUsername !== username) {
      await db.execute(
        sql`ALTER USER ${sql.identifier(username)} RENAME TO ${sql.identifier(
          newUsername
        )}`
      );
    }

    if (role !== undefined && role !== "") {
      const currentRolesResult = await db.execute(
        sql`SELECT r.rolname FROM pg_catalog.pg_roles r 
         JOIN pg_catalog.pg_auth_members m ON m.roleid = r.oid 
         JOIN pg_catalog.pg_roles u ON u.oid = m.member 
         WHERE u.rolname = ${username}`
      );

      for (const roleRow of currentRolesResult.rows) {
        const roleName = String((roleRow as any).rolname);
        await db.execute(
          sql`REVOKE ${sql.identifier(roleName)} FROM ${sql.identifier(
            username
          )}`
        );
      }

      await db.execute(
        sql`GRANT ${sql.identifier(role)} TO ${sql.identifier(username)}`
      );
    }

    return res.status(200).json(UpdateUserResponseSchema.parse({ message: "User updated successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


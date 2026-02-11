import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";

export const updateRolePrivileges = async (req: Request, res: Response) => {
  try {
    const { rolename } = req.params;
    const { table, updatedPrivileges } = req.body as {
      table: string;
      updatedPrivileges: string[];
    };

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
      .json({ message: "Privileges of role updated successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


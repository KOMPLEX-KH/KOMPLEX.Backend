import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";

interface TablePrivileges {
  name: string;
  privileges: string[];
}

export const createRole = async (req: Request, res: Response) => {
  try {
    const {
      role,
      tableAndPrivileges,
    }: { role: string; tableAndPrivileges: TablePrivileges[] } = req.body;

    if (!role) {
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

    return res.status(201).json({ message: "Role created successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


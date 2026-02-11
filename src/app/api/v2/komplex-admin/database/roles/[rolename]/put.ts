import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";

export const updateRoleName = async (req: Request, res: Response) => {
  try {
    const { oldRole, newRole } = req.body as {
      oldRole: string;
      newRole: string;
    };

    if (!oldRole || !newRole) {
      throw new ResponseError("Missing required fields", 400);
    }

    await db.execute(
      sql`ALTER ROLE ${sql.identifier(oldRole)} RENAME TO ${sql.identifier(
        newRole
      )}`
    );

    return res.status(200).json({ message: "Role updated successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


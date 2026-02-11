import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { rolename } = req.params;
    if (!rolename) {
      throw new ResponseError("Missing required fields", 400);
    }

    await db.execute(sql`DROP ROLE ${sql.identifier(rolename)}`);

    return res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


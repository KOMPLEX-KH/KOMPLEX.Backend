import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    if (!username) {
      throw new ResponseError("Missing required fields", 400);
    }

    await db.execute(sql`DROP USER ${sql.identifier(username)}`);

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


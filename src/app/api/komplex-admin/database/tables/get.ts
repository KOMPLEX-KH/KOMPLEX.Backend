import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";

export const getTables = async (req: Request, res: Response) => {
  try {
    const tablesResult = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );

    const tables = tablesResult.rows.map((row: any) => row.table_name);

    return res.status(200).json(tables);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


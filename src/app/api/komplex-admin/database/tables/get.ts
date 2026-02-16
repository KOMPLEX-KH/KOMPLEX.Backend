import { Request, Response } from "express";
import { getResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { sql } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const GetTablesResponseSchema = z.object({
  tables: z.array(z.string()),
}).openapi("GetTablesResponse");

export const getTables = async (req: Request, res: Response) => {
  try {
    const tablesResult = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );

    const tables = tablesResult.rows.map((row: any) => row.table_name);

    return res.status(200).json(GetTablesResponseSchema.parse(tables));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


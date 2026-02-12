import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const GetPrivilegesResponseSchema = z.object({
  privileges: z.array(z.string()),
}).openapi("GetPrivilegesResponse");

export const GetPrivileges = async (req: Request, res: Response) => {
  try {
    const privilegesResult = await db.execute(
      sql`SELECT DISTINCT privilege_type 
       FROM information_schema.role_table_grants 
       WHERE table_schema = 'public' 
       ORDER BY privilege_type`
    );

    const privileges = privilegesResult.rows.map(
      (row: any) => row.privilege_type
    );

    return res.status(200).json(GetPrivilegesResponseSchema.parse(privileges));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


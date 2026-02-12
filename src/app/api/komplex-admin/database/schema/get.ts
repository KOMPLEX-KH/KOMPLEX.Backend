import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

interface TableColumn {
  column_name: string;
  data_type: string;
}

interface Table {
  rowCount: number;
  name: string;
  columns: TableColumn[];
}

export const GetSchemaDataResponseSchema = z.object({
  tables: z.array(z.object({
    rowCount: z.number(),
    name: z.string(),
    columns: z.array(z.object({
      column_name: z.string(),
      data_type: z.string(),
    })),
  })),
}).openapi("GetSchemaDataResponse");

export const GetSchemaData = async (req: Request, res: Response) => {
  try {
    const tableNamesResult = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema = 'public'`
    );
    const tableNames = tableNamesResult.rows as Array<{ table_name: string }>;

    const tableColumnsResult = await db.execute(
      sql`SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public'`
    );
    const tableColumns = tableColumnsResult.rows as Array<{
      table_name: string;
      column_name: string;
      data_type: string;
    }>;

    const tablesData: Table[] = [];

    for (const tableNameRow of tableNames) {
      const tableName = tableNameRow.table_name;

      const tableColumnsForTable = tableColumns.filter(
        (row) => row.table_name === tableName
      );

      const rowCountResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}`
      );
      const rowCount = parseInt(String(rowCountResult.rows[0]?.count || "0"));

      tablesData.push({
        rowCount,
        name: tableName,
        columns: tableColumnsForTable.map((row) => ({
          column_name: row.column_name,
          data_type: row.data_type,
        })),
      });
    }

    return res.status(200).json(GetSchemaDataResponseSchema.parse(tablesData));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


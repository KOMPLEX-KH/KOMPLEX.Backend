import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const DatabaseDashboardResponseSchema = z.object({
  numOfUsers: z.number(),
  numOfRoles: z.number(),
  databaseSize: z.string(),
  totalBackups: z.number(),
  numOfTables: z.number(),
  numOfViews: z.number(),
  numOfIndexes: z.number(),
  numOfTriggers: z.number(),
  recentActivities: z.array(z.object({
    usename: z.string(),
    ip: z.string(),
    status: z.string(),
    backend_start: z.date(),
  })),
}).openapi("DatabaseDashboardResponse");

export const getDatabaseDashboard = async (req: Request, res: Response) => {
  try {
    let data = {
      numOfUsers: 0,
      numOfRoles: 0,
      databaseSize: "0 MB",
      totalBackups: 0,
      numOfTables: 0,
      numOfViews: 0,
      numOfIndexes: 0,
      numOfTriggers: 0,
      recentActivities: [],
    };

    const numOfUsersResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM pg_user WHERE usename NOT IN ('michael', 'emily', 'john', 'donald', 'maria', 'jessica', 'henry', 'gemma', 'jerry')`
    );
    const numOfUsers = parseInt(String(numOfUsersResult.rows[0]?.count || "0"));

    const numOfRolesResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM pg_roles`
    );
    const numOfRoles = parseInt(String(numOfRolesResult.rows[0]?.count || "0"));

    const databaseSizeResult = await db.execute(
      sql`SELECT pg_size_pretty(pg_database_size(current_database())) as pg_size_pretty`
    );
    const databaseSize = String(
      databaseSizeResult.rows[0]?.pg_size_pretty || "0 MB"
    );

    const numOfTablesResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'`
    );
    const numOfTables = parseInt(String(numOfTablesResult.rows[0]?.count || "0"));

    const numOfViewsResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM information_schema.views WHERE table_schema = 'public'`
    );
    const numOfViews = parseInt(String(numOfViewsResult.rows[0]?.count || "0"));

    const numOfIndexesResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM pg_indexes WHERE schemaname = 'public'`
    );
    const numOfIndexes = parseInt(
      String(numOfIndexesResult.rows[0]?.count || "0")
    );

    const numOfTriggersResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM information_schema.triggers WHERE trigger_schema = 'public'`
    );
    const numOfTriggers = parseInt(
      String(numOfTriggersResult.rows[0]?.count || "0")
    );

    const recentActivitiesResult = await db.execute(
      sql`SELECT usename, client_addr, state, backend_start FROM pg_stat_activity ORDER BY backend_start DESC LIMIT 10`
    );
    const recentActivities = recentActivitiesResult.rows.map((row: any) => ({
      usename: row.usename || "Unknown",
      ip: row.client_addr || "Unknown",
      status: row.state || "Unknown",
      backend_start: row.backend_start ? new Date(row.backend_start) : new Date(),
    }));

    data = {
      numOfUsers,
      numOfRoles,
      databaseSize,
      totalBackups: 0,
      numOfTables,
      numOfViews,
      numOfIndexes,
      numOfTriggers,
      recentActivities: recentActivities as any,
    };

    return res.status(200).json(DatabaseDashboardResponseSchema.parse(data));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


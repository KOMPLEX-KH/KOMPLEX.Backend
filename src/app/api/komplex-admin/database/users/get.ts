import { Request, Response } from "express";
import { getResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { sql } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const GetUsersResponseSchema = z.object({
  users: z.array(z.object({
    username: z.string(),
    isSuperuser: z.boolean(),
    isCreateDB: z.boolean(),
    isReplicable: z.boolean(),
    byPassRLS: z.boolean(),
    passwordExpire: z.string().nullable(),
  })),
}).openapi("GetUsersResponse");

export const getUsers = async (req: Request, res: Response) => {
  try {
    const usersResult = await db.execute(
      sql`SELECT usename, usesuper, usecreatedb, userepl, usebypassrls, valuntil FROM pg_user WHERE passwd IS NOT NULL 
      AND usename NOT IN ('michael', 'emily', 'john', 'donald', 'maria', 'jessica', 'henry', 'gemma', 'jerry')`
    );

    const data = usersResult.rows.map((user: any) => ({
      username: user.usename,
      isSuperuser: user.usesuper || false,
      isCreateDB: user.usecreatedb || false,
      isReplicable: user.userepl || false,
      byPassRLS: user.usebypassrls || false,
      passwordExpire: user.valuntil || null,
    }));

    return res.status(200).json(GetUsersResponseSchema.parse(data));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


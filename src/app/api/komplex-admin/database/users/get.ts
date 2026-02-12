import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";

interface UserData {
  username: string;
  isSuperuser: boolean;
  isCreateDB: boolean;
  isReplicable: boolean;
  byPassRLS: boolean;
  passwordExpire: string | null;
}

export const getUsers = async (req: Request, res: Response) => {
  try {
    const usersResult = await db.execute(
      sql`SELECT usename, usesuper, usecreatedb, userepl, usebypassrls, valuntil FROM pg_user WHERE passwd IS NOT NULL 
      AND usename NOT IN ('michael', 'emily', 'john', 'donald', 'maria', 'jessica', 'henry', 'gemma', 'jerry')`
    );

    const data: UserData[] = usersResult.rows.map((user: any) => ({
      username: user.usename,
      isSuperuser: user.usesuper || false,
      isCreateDB: user.usecreatedb || false,
      isReplicable: user.userepl || false,
      byPassRLS: user.usebypassrls || false,
      passwordExpire: user.valuntil || null,
    }));

    return res.status(200).json(data);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


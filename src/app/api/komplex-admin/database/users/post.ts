import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";

interface CreateUserBody {
  username: string;
  password: string;
  role?: string;
}

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, password, role }: CreateUserBody = req.body;

    if (!username || !password) {
      throw new ResponseError("Missing required fields", 400);
    }

    const restrictedUsernames = [
      "michael",
      "emily",
      "john",
      "donald",
      "maria",
      "jessica",
      "henry",
      "gemma",
      "jerry",
    ];

    if (restrictedUsernames.includes(username)) {
      throw new ResponseError("Cannot create user with these credentials", 400);
    }

    await db.execute(
      sql`CREATE USER ${sql.identifier(username)} WITH PASSWORD ${password}`
    );

    if (role) {
      await db.execute(
        sql`GRANT ${sql.identifier(role)} TO ${sql.identifier(username)}`
      );
    }

    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


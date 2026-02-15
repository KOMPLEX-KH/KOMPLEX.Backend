import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { sql } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const CreateUserBodySchema = z.object({
  username: z.string(),
  password: z.string(),
  role: z.string().optional(),
}).openapi("CreateUserBody");

export const CreateUserResponseSchema = z.object({
  message: z.string(),
}).openapi("CreateUserResponse");

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, password, role } = await CreateUserBodySchema.parseAsync(req.body);

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

    return res.status(201).json(CreateUserResponseSchema.parse({ message: "User created successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


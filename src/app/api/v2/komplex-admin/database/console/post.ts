import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";

export const executeConsoleCommand = async (req: Request, res: Response) => {
  try {
    const { command } = req.body as { command: string };

    if (!command) {
      throw new ResponseError("Command is required", 400);
    }

    const splitCommand = command.split(" ");
    const dangerousCommands = [
      "drop",
      "delete",
      "truncate",
      "alter",
      "rename",
      "create",
      "insert",
      "update",
      "grant",
      "revoke",
    ];

    if (
      splitCommand.some((cmd: string) =>
        dangerousCommands.includes(cmd.toLowerCase())
      )
    ) {
      throw new ResponseError(
        "This command is not allowed, only for read operations",
        400
      );
    }

    const result = await db.execute(sql.raw(command));

    if (result.rows && result.rows.length > 0) {
      return res.status(200).json(result.rows);
    }

    return res.status(404).json({ error: "No results found" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { sql } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const ExecuteConsoleCommandBodySchema = z.object({
  command: z.string(),
}).openapi("ExecuteConsoleCommandBody");

export const ExecuteConsoleCommandResponseSchema = z.object({
  result: z.any(),
}).openapi("ExecuteConsoleCommandResponse");

export const ExecuteConsoleCommandResultSchema = z.object({
  rows: z.array(z.any()),
}).openapi("ExecuteConsoleCommandResult");

export const executeConsoleCommand = async (req: Request, res: Response) => {
  try {
    const { command } = await ExecuteConsoleCommandBodySchema.parseAsync(req.body);

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
      return res.status(200).json(ExecuteConsoleCommandResultSchema.parse(result.rows));
    }

    return res.status(404).json(ExecuteConsoleCommandResponseSchema.parse({ error: "No results found" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};


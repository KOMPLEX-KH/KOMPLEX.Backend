import { pgEnum } from "drizzle-orm/pg-core";

export const responseTypeEnum = pgEnum("response_type", ["normal", "komplex"]);
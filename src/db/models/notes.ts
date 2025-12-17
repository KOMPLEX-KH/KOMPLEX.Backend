import {
  pgTable,
  text,
  date,
  timestamp,
  serial,
  boolean,
  varchar,
  integer
} from "drizzle-orm/pg-core";
import { users } from "../schema.js";


export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title"),
  content: text("content"),
  topic: text("topic"),
  tags: varchar("tags"),
  isArchived: boolean("is_archived").notNull().default(false),
  isPinned: boolean("is_pinned").notNull().default(false),
  reminderAt: date("reminder_at"),
  createdAt: timestamp("created_at", { mode: "date" }),
  updatedAt: timestamp("updated_at", { mode: "date" }),
});

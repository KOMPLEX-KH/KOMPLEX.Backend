import {
  pgTable,
  varchar,
  text,
  integer,
  timestamp,
  serial,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id"),
  duration: integer("duration"),
  title: text("title"),
  userId: integer("user_id").references(() => users.id),
  description: text("description"),
  subject: text("subject"),
  grade: varchar("grade"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

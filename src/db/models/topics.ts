import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { lessons } from "./lessons.js";

export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  englishTitle: text("english_title"),
  component: jsonb("component"),
  componentCode: text("component_code"),
  lessonId: integer("lesson_id")
    .notNull()
    .references(() => lessons.id)
});


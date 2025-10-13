import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { subjects } from "./subjects.js";

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  lesson: text("lesson").notNull(),
  title: text("title"),
  englishTitle: text("english_title"),
  icon: text("icon"),
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id),
});


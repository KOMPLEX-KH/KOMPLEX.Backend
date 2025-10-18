import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { grades } from "./grades.js";

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  title: text("title"),
  englishTitle: text("english_title"),
  icon: text("icon"),
  gradeId: integer("grade_id")
    .notNull()
    .references(() => grades.id),
  orderIndex: integer("order_index"),
});


import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { grades } from "./grades.js";

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name"),
  icon: text("icon"),
  gradeId: integer("grade_id")
    .notNull()
    .references(() => grades.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index"),
});


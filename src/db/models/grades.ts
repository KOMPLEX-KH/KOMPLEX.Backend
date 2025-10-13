import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  grade: text("grade").unique().notNull(),
  gradeKhmer: text("grade_khmer"),
});


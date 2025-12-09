import {
  pgTable,
  text,
  date,
  timestamp,
  serial,
  boolean,
  
  integer
} from "drizzle-orm/pg-core";
import { subjects } from "./subjects.js";
import { grades } from "./grades.js";
import { lessons } from "./lessons.js";


export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author"),
  gradeId: integer("grade_id").references(() => grades.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  isRecommended: boolean('is_Recommended').notNull().default(false),
  subjectId: integer("category_id").references(() => subjects.id),
  publishedDate: date("published_date"),
  description: text("description"),
  pdfUrl: text("pdf_url"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


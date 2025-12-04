import {
  pgTable,
  text,
  date,
  timestamp,
  serial,
  boolean
} from "drizzle-orm/pg-core";


export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author"),
  lesson: text('lesson'),
  isRecommended: boolean('is_Recommended').notNull().default(false),
  category: text('category'),
  publishedDate: date("published_date"),
  description: text("description"),
  pdfUrl: text("pdf_url"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


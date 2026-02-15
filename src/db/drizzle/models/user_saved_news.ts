import { pgTable, timestamp, serial, integer } from "drizzle-orm/pg-core";
import { news, users } from "../schema.js";

export const userSavedNews = pgTable(
  "user_saved_news",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    newsId: integer("news_id").references(() => news.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    uniqueKeys: {
      uniqueUserNewsSave: [table.userId, table.newsId],
    },
  })
);

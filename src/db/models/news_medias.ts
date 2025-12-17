import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { mediaTypeEnum } from "./media_type.js";
import { news } from "./news.js";
export const newsMedia = pgTable("news_media", {
	id: serial("id").primaryKey(),
	newsId: integer("news_id").references(() => news.id),
	url: text("url"),
	urlForDeletion: text("url_for_deletion"),
	mediaType: mediaTypeEnum("media_type"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

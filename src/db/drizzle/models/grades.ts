import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  name: text("name"),
  orderIndex: integer("order_index"),
});


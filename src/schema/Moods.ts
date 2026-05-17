import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
export const moods = pgTable("moods", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  value: integer("value").notNull(),
  label: varchar("label", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Mood = typeof moods.$inferSelect;
export type NewMood = typeof moods.$inferInsert;

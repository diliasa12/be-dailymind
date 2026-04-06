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
import { users } from "./auth-schema";
export const Moods = pgTable("moods", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  value: integer("value").notNull(),
  label: varchar("label", { length: 50 }).notNull(),
  emotions: jsonb("emotions").default([]).notNull(),
  factors: jsonb("factors").default([]).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Moods = typeof Moods.$inferSelect;
export type NewMoods = typeof Moods.$inferInsert;

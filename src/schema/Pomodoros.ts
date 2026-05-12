import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const pomodoros = pgTable("pomodoros", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Pomodoro = typeof pomodoros.$inferSelect;
export type NewPomodoro = typeof pomodoros.$inferInsert;

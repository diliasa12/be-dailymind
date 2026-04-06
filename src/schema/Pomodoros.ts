import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { users } from "./auth-schema";

export const Pomodoros = pgTable("pomodoros", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Pomodoro = typeof Pomodoros.$inferSelect;
export type NewPomodoro = typeof Pomodoros.$inferInsert;

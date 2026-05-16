import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const bannedWords = pgTable("banned_words", {
  id: serial("id").primaryKey(),
  word: text("word").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BannedWord = typeof bannedWords.$inferSelect;
export type NewBannedWord = typeof bannedWords.$inferInsert;

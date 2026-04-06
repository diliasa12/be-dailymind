import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { moods, pomodoros, journals, todos, feedbacks } from "../schema/app-schema";

export const insertMoodSchema = createInsertSchema(moods);
export const selectMoodSchema = createSelectSchema(moods);

export const insertPomodoroSchema = createInsertSchema(pomodoros);
export const selectPomodoroSchema = createSelectSchema(pomodoros);

export const insertJournalSchema = createInsertSchema(journals);
export const selectJournalSchema = createSelectSchema(journals);

export const insertTodoSchema = createInsertSchema(todos).omit({
    id: true,
    userId: true,
    createdAt: true,
    completedAt: true,
});

export const updateTodoSchema = createInsertSchema(todos).omit({
    id: true,
    userId: true,
    createdAt: true,
}).partial();
export const selectTodoSchema = createSelectSchema(todos);

export const insertFeedbackSchema = createInsertSchema(feedbacks);
export const selectFeedbackSchema = createSelectSchema(feedbacks);
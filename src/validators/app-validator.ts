import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { moods, pomodoros, journals, todos, feedbacks } from "@/schema";

export const insertMoodSchema = createInsertSchema(moods).omit({
  id: true,
  userId: true,
  createdAt: true,
});
export const selectMoodSchema = createSelectSchema(moods);

export const insertPomodoroSchema = createInsertSchema(pomodoros).omit({
  id: true,
  userId: true,
  createdAt: true,
});
export const selectPomodoroSchema = createSelectSchema(pomodoros);

export const insertJournalSchema = createInsertSchema(journals).omit({
  id: true,
  userId: true,
  createdAt: true,
});
export const updateJournalSchema = createInsertSchema(journals).omit({
  id: true,
  userId: true,
  createdAt: true,
}).partial();
export const selectJournalSchema = createSelectSchema(journals);

export const insertTodoSchema = createInsertSchema(todos).omit({
  id: true,
  userId: true,
  createdAt: true,
  completedAt: true,
});

export const updateTodoSchema = createInsertSchema(todos)
  .omit({
    id: true,
    userId: true,
    createdAt: true,
  })
  .partial();
export const selectTodoSchema = createSelectSchema(todos);

export const insertFeedbackSchema = createInsertSchema(feedbacks).omit({
  id: true,
  userId: true,
  createdAt: true,
});
export const selectFeedbackSchema = createSelectSchema(feedbacks);

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { db } from "../db/db";
import { feedbacks } from "../schema/Feedbacks";
import { insertFeedbackSchema, updateFeedbackSchema } from "../validators/app-validator";
import { authMiddleware } from "../middlewares/auth.middleware";
import { AppVariables } from "@/types/type";

const feedbackApp = new Hono<{ Variables: AppVariables }>();

feedbackApp.use("*", authMiddleware);

feedbackApp.post("/", zValidator("json", insertFeedbackSchema), async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");

    const newFeedback = await db.insert(feedbacks).values({
        message: body.message,
        userId: user!.id,
    }).returning();

    return c.json({ data: newFeedback[0] }, 201);
});

feedbackApp.get("/", async (c) => {
    const user = c.get("user");

    const data = await db.select().from(feedbacks).where(eq(feedbacks.userId, user!.id));

    return c.json({ data });
});

feedbackApp.get("/:id", async (c) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));

    const data = await db.select()
        .from(feedbacks)
        .where(and(eq(feedbacks.id, id), eq(feedbacks.userId, user!.id)));

    if (data.length === 0) {
        return c.json({ error: "Feedback tidak ditemukan" }, 404);
    }

    return c.json({ data: data[0] });
});

feedbackApp.delete("/:id", async (c) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));

    const deletedFeedback = await db.delete(feedbacks)
        .where(and(eq(feedbacks.id, id), eq(feedbacks.userId, user!.id)))
        .returning();

    if (deletedFeedback.length === 0) {
        return c.json({ error: "Feedback tidak ditemukan" }, 404);
    }

    return c.json({ data: deletedFeedback[0] });
});

feedbackApp.patch("/:id", zValidator("json", updateFeedbackSchema), async (c) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    const body = c.req.valid("json");

    const updatedFeedback = await db.update(feedbacks)
        .set({ message: body.message })
        .where(and(eq(feedbacks.id, id), eq(feedbacks.userId, user!.id)))
        .returning();

    if (updatedFeedback.length === 0) {
        return c.json({ error: "Feedback tidak ditemukan" }, 404);
    }

    return c.json({ data: updatedFeedback[0] });
});

export default feedbackApp;
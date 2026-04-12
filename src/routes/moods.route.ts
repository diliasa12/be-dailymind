import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/db";
import { moods } from "../schema/Moods";
import { insertMoodSchema } from "../validators/app-validator";
import { authMiddleware } from "../middlewares/auth.middleware";
import { AppVariables } from "@/types/type";

const moodApp = new Hono<{ Variables: AppVariables }>();

moodApp.use("*", authMiddleware);

moodApp.post("/", zValidator("json", insertMoodSchema), async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");

    const newMood = await db.insert(moods).values({
        ...body,
        userId: user!.id,
    }).returning();

    return c.json({ data: newMood[0] }, 201);
});

moodApp.get("/", async (c) => {
    const user = c.get("user");

    const data = await db.select()
        .from(moods)
        .where(eq(moods.userId, user!.id))
        .orderBy(desc(moods.createdAt));

    return c.json({ data });
});

moodApp.get("/:id", async (c) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));

    const data = await db.select()
        .from(moods)
        .where(and(eq(moods.id, id), eq(moods.userId, user!.id)));

    if (data.length === 0) {
        return c.json({ error: "Mood tidak ditemukan" }, 404);
    }

    return c.json({ data: data[0] });
});

moodApp.delete("/:id", async (c) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));

    const deletedMood = await db.delete(moods)
        .where(and(eq(moods.id, id), eq(moods.userId, user!.id)))
        .returning();

    if (deletedMood.length === 0) {
        return c.json({ error: "Mood tidak ditemukan" }, 404);
    }

    return c.json({ data: deletedMood[0] });
});

export default moodApp;
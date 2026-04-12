import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/db";
import { pomodoros } from "../schema/Pomodoros";
import { insertPomodoroSchema } from "../validators/app-validator";
import { authMiddleware } from "../middlewares/auth.middleware";
import { AppVariables } from "@/types/type";

const pomodoroApp = new Hono<{ Variables: AppVariables }>();

pomodoroApp.use("*", authMiddleware);

pomodoroApp.post("/", zValidator("json", insertPomodoroSchema), async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");

    const newPomodoro = await db.insert(pomodoros).values({
        ...body,
        userId: user!.id,
    }).returning();

    return c.json({ data: newPomodoro[0] }, 201);
});

pomodoroApp.get("/", async (c) => {
    const user = c.get("user");

    const data = await db.select()
        .from(pomodoros)
        .where(eq(pomodoros.userId, user!.id))
        .orderBy(desc(pomodoros.createdAt)); 

    return c.json({ data });
});

pomodoroApp.delete("/:id", async (c) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));

    const deletedPomodoro = await db.delete(pomodoros)
        .where(and(eq(pomodoros.id, id), eq(pomodoros.userId, user!.id)))
        .returning();

    if (deletedPomodoro.length === 0) {
        return c.json({ error: "Data Pomodoro tidak ditemukan" }, 404);
    }

    return c.json({ data: deletedPomodoro[0] });
});

export default pomodoroApp;
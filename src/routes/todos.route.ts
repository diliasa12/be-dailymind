import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { db } from "../db/db";
import { todos } from "../schema/Todos";
import { insertTodoSchema, updateTodoSchema } from "../validators/app-validator";
import { authMiddleware } from "../middlewares/auth.middleware";
import { AppVariables } from "@/types/type";

const todoApp = new Hono<{ Variables: AppVariables }>();

todoApp.use("*", authMiddleware);

todoApp.post("/", zValidator("json", insertTodoSchema), async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");

    const newTodo = await db.insert(todos).values({
        ...body,
        userId: user!.id,
    }).returning();

    return c.json({ data: newTodo[0] }, 201);
});

todoApp.get("/", async (c) => {
    const user = c.get("user");

    const data = await db.select().from(todos).where(eq(todos.userId, user!.id));

    return c.json({ data });
});

todoApp.get("/:id", async (c) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));

    const data = await db.select()
        .from(todos)
        .where(and(eq(todos.id, id), eq(todos.userId, user!.id)));

    if (data.length === 0) {
        return c.json({ error: "Todo tidak ditemukan" }, 404);
    }

    return c.json({ data: data[0] });
});

todoApp.patch("/:id", zValidator("json", updateTodoSchema), async (c) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    const body = c.req.valid("json");

    const updateData: any = { ...body };

    if (body.isCompleted === true) {
        updateData.completedAt = new Date();
    } else if (body.isCompleted === false) {
        updateData.completedAt = null;
    }

    const updatedTodo = await db.update(todos)
        .set(updateData)
        .where(and(eq(todos.id, id), eq(todos.userId, user!.id)))
        .returning();

    if (updatedTodo.length === 0) {
        return c.json({ error: "Todo tidak ditemukan" }, 404);
    }

    return c.json({ data: updatedTodo[0] });
});

todoApp.delete("/:id", async (c) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));

    const deletedTodo = await db.delete(todos)
        .where(and(eq(todos.id, id), eq(todos.userId, user!.id)))
        .returning();

    if (deletedTodo.length === 0) {
        return c.json({ error: "Todo tidak ditemukan" }, 404);
    }

    return c.json({ data: deletedTodo[0] });
});

export default todoApp;
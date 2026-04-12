import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/db";
import { journals } from "../schema/Journals";
import { insertJournalSchema, updateJournalSchema } from "../validators/app-validator";
import { authMiddleware } from "../middlewares/auth.middleware";
import { AppVariables } from "@/types/type";

const journalApp = new Hono<{ Variables: AppVariables }>();

journalApp.use("*", authMiddleware);

journalApp.post("/", zValidator("json", insertJournalSchema), async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");

    const newJournal = await db.insert(journals).values({
        ...body,
        userId: user!.id,
    }).returning();

    return c.json({ data: newJournal[0] }, 201);
});

journalApp.get("/", async (c) => {
    const user = c.get("user");

    const data = await db.select()
        .from(journals)
        .where(eq(journals.userId, user!.id))
        .orderBy(desc(journals.createdAt));

    return c.json({ data });
});

journalApp.get("/:id", async (c) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));

    const data = await db.select()
        .from(journals)
        .where(and(eq(journals.id, id), eq(journals.userId, user!.id)));

    if (data.length === 0) {
        return c.json({ error: "Jurnal tidak ditemukan" }, 404);
    }

    return c.json({ data: data[0] });
});

journalApp.patch("/:id", zValidator("json", updateJournalSchema), async (c) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    const body = c.req.valid("json");

    const updatedJournal = await db.update(journals)
        .set(body)
        .where(and(eq(journals.id, id), eq(journals.userId, user!.id)))
        .returning();

    if (updatedJournal.length === 0) {
        return c.json({ error: "Jurnal tidak ditemukan" }, 404);
    }

    return c.json({ data: updatedJournal[0] });
});

journalApp.delete("/:id", async (c) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));

    const deletedJournal = await db.delete(journals)
        .where(and(eq(journals.id, id), eq(journals.userId, user!.id)))
        .returning();

    if (deletedJournal.length === 0) {
        return c.json({ error: "Jurnal tidak ditemukan" }, 404);
    }

    return c.json({ data: deletedJournal[0] });
});

export default journalApp;
import { Hono } from "hono";
import { db } from "../db/db";
import { sql } from "drizzle-orm";

const pingRoute = new Hono();

pingRoute.get("/", async (c) => {
    try {
        await db.execute(sql`SELECT 1`);
        return c.json({ message: "pong", db: "connected" }, 200);
    } catch (error) {
        
    return c.json({ error: "Database connection failed" }, 500);
    }
});

export default pingRoute;
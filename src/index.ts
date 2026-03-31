import { Hono } from "hono";
import { drizzle } from "drizzle-orm/node-postgres";
const db = drizzle(process.env.DATABASE_URL!);
const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;

import { Hono } from "hono";
import { auth } from "@/lib/auth";
import { cors } from "hono/cors";
import { authMiddleware } from "./middlewares/auth.middleware";
import { AppVariables } from "./types/type";

import todoApp from "./routes/todos.route";
import feedbackApp from "./routes/feedbacks.route";
import pomodoroApp from "./routes/pomodoro.route";
import moodApp from "./routes/moods.route";
import journalApp from "./routes/journals.route";

const app = new Hono<{
  Variables: AppVariables;
}>();


app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"], // Tambahkan 'null' jika buka file langsung
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"], // ✅ tambah Cookie
    exposeHeaders: ["Content-Length", "Set-Cookie"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.get("/", (c) => {
  return c.text("hello dili");
});

app.route("/todos", todoApp);
app.route("/feedbacks", feedbackApp);
app.route("/pomodoros", pomodoroApp);
app.route("/moods", moodApp);
app.route("/journals", journalApp);

export default app;

import { Hono } from "hono";
import { auth } from "@/lib/auth";
import { cors } from "hono/cors";
import { openAPIRouteHandler } from "hono-openapi";
import { swaggerUI } from "@hono/swagger-ui";

import { AppVariables } from "./types/type";

import todoApp from "./routes/todos.route";
import feedbackApp from "./routes/feedbacks.route";
import pomodoroApp from "./routes/pomodoro.route";
import moodApp from "./routes/moods.route";
import journalApp from "./routes/journals.route";
import adminFeedbackApp from "./routes/admin-feedbacks.route";
import bannedWordsApp from "./routes/banned-words.route";

// ─── Routes App ───────────────────────────────────────────────────────────────

const routes = new Hono<{ Variables: AppVariables }>();

routes.route("/todos", todoApp);
routes.route("/feedbacks", feedbackApp);
routes.route("/pomodoros", pomodoroApp);
routes.route("/moods", moodApp);
routes.route("/journals", journalApp);
routes.route("/admin/feedbacks", adminFeedbackApp);
routes.route("/admin/banned-words", bannedWordsApp);

// ─── Main App ─────────────────────────────────────────────────────────────────

const app = new Hono<{ Variables: AppVariables }>();

app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposeHeaders: ["Content-Length", "Set-Cookie"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.route("/", routes);

// ─── OpenAPI Spec ──────────────────────────────────────────────────────────────

app.get(
  "/openapi.json",
  openAPIRouteHandler(routes, {
    documentation: {
      info: {
        title: "MindTrack API",
        version: "1.0.0",
        description:
          "REST API untuk manajemen mood, jurnal, pomodoro, todo, feedback, dan fitur admin.",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Development server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Masukkan session token dari Better Auth",
          },
        },
      },
      security: [{ bearerAuth: [] }],
      tags: [
        { name: "Moods", description: "Manajemen data mood harian" },
        { name: "Journals", description: "Manajemen jurnal pribadi" },
        { name: "Pomodoros", description: "Pencatatan sesi pomodoro" },
        { name: "Todos", description: "Manajemen daftar tugas" },
        { name: "Feedbacks", description: "Kirim feedback dari user" },
        {
          name: "Feedback Management (Admin)",
          description: "Kelola feedback user — khusus admin",
        },
        {
          name: "Banned Words (Admin)",
          description: "Kamus kata terlarang — khusus admin",
        },
      ],
    },
  }),
);

// ─── Swagger UI ────────────────────────────────────────────────────────────────

app.get("/ui", swaggerUI({ url: "/openapi.json" }));

export default app;

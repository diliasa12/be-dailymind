import { AppVariables } from "@/types/type";
import { auth } from "@/lib/auth";
import { createMiddleware } from "hono/factory";
export const authMiddleware = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    console.log(c.req.raw.headers);

    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("user", session.user);
    c.set("session", session.session);

    await next();
  },
);

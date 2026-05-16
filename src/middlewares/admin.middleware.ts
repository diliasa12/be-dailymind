import { createMiddleware } from "hono/factory";
import { AppVariables } from "@/types/type";

type UserWithRole = AppVariables["user"] & {
  role?: string | null;
};

export const adminMiddleware = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const user = c.get("user") as UserWithRole | null;

    if (!user || user.role !== "admin") {
      return c.json(
        { error: "Forbidden: hanya admin yang dapat mengakses endpoint ini" },
        403,
      );
    }

    await next();
  },
);

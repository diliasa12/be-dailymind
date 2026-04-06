import { User, Session } from "@/lib/auth";

export type AppVariables = {
  user: User | null;
  session: Session | null;
};

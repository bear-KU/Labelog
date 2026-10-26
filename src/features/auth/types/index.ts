import type { AuthUser } from "@/features/users/types";

export type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
};

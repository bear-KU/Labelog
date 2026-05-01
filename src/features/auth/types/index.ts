import type { User } from "@/features/users/types";

export type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
};

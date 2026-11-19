import type { users } from "@/lib/db/schema";

export type AuthUser = Pick<
  typeof users.$inferSelect,
  "id" | "name" | "isApproved" | "role"
>;

import "server-only";

import { getMyAuthUser } from "@/features/users/services/users";
import type { AuthUser } from "@/features/users/types";

export class ForbiddenError extends Error {
  constructor() {
    super("User is not approved");
    this.name = "ForbiddenError";
  }
}

export async function requireApprovedUser(): Promise<AuthUser> {
  const user = await getMyAuthUser();

  if (!user.isApproved) {
    throw new ForbiddenError();
  }

  return user;
}

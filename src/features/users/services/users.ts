import "server-only";

import { eq } from "drizzle-orm";

import { neonAuth } from "@/features/auth/server";
import type { AuthUser } from "@/features/users/types";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

type UserServiceErrorCode =
  | "UNAUTHENTICATED"   // 401
  | "USER_NOT_FOUND"    // 404
  | "AUTH_UNAVAILABLE"; // 502

export class UserServiceError extends Error {
  constructor(
    public readonly code: UserServiceErrorCode,
    message: string
  ) {
    super(message);
    this.name = "UserServiceError";
  }
}

async function requireIdentity() {
  const { data: session, error } = await neonAuth.getSession();

  if (error) {
    console.error("Failed to retrieve auth session:", error);

    throw new UserServiceError(
      "AUTH_UNAVAILABLE",
      "Failed to retrieve auth session"
    );
  }

  if (!session?.user) {
    throw new UserServiceError(
      "UNAUTHENTICATED",
      "User is not authenticated"
    );
  }

  return session.user;
}

async function findAuthUser(userId: string): Promise<AuthUser | null> {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      isApproved: users.isApproved,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

export async function getMyAuthUser(): Promise<AuthUser> {
  const identity = await requireIdentity();
  const user = await findAuthUser(identity.id);

  if (!user) {
    throw new UserServiceError(
      "USER_NOT_FOUND",
      "Authenticated user not found in the database"
    )
  }

  return user;
}

export async function initializeMyAuthUser(): Promise<AuthUser> {
  const identity = await requireIdentity();

  await db
    .insert(users)
    .values({
      id: identity.id,
      name: identity.name?.trim() || identity.email,
    })
    .onConflictDoNothing({ target: users.id });

    const user = await findAuthUser(identity.id);

    if (!user) {
      throw new Error("Failed to initialize user");
    }

    return user;
}

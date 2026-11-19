import { NextResponse } from "next/server";

import {
  getMyAuthUser,
  initializeMyAuthUser,
  UserServiceError,
} from "@/features/users/services/users";

import type { AuthUser } from "@/features/users/types";

const responseHeaders = {
  "Cache-Control": "private, no-store",
};

function errorResponse(error: unknown) {
  if (error instanceof UserServiceError) {
    const statusCodes = {
      UNAUTHENTICATED: 401,
      USER_NOT_FOUND: 404,
      AUTH_UNAVAILABLE: 502,
    };

    return NextResponse.json(
      {error: error.message},
      {
        status: statusCodes[error.code],
        headers: responseHeaders,
      },
    );
  }

  console.error("User API failed:", error);

  return NextResponse.json(
    {error: "Internal Server Error"},
    {
      status: 500,
      headers: responseHeaders,
    },
  );
}

export async function GET() {
  try {
    const user = await getMyAuthUser();

    return NextResponse.json<AuthUser>(
      user,
      {
        headers: responseHeaders,
      }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST() {
  try {
    const user = await initializeMyAuthUser();

    return NextResponse.json<AuthUser>(
      user,
      {
        headers: responseHeaders,
      }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

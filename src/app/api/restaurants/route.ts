import { NextResponse } from "next/server";

import { ForbiddenError } from "@/features/auth/services/authorization";
import { createRestaurantSchema } from "@/features/restaurants/schemas/restaurant";
import {
  getRestaurants,
  createRestaurant,
} from "@/features/restaurants/services/restaurants";
import type { Restaurant } from "@/features/restaurants/types";
import { UserServiceError } from "@/features/users/services/users";

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
      { error: error.message },
      {
        status: statusCodes[error.code],
        headers: responseHeaders,
      },
    );
  }
  
  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 403,
        headers: responseHeaders,
      },
    );
  }

  console.error("Restaurants API failed:", error);

  return NextResponse.json(
    { error: "Internal Server Error" },
    {
      status: 500,
      headers: responseHeaders,
    },
  );
}

export async function GET() {
  try {
    const restaurants = await getRestaurants();

    return NextResponse.json<Restaurant[]>(
      restaurants,
      {
        headers: responseHeaders,
      }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: "JSON の形式が正しくありません" },
          {
            status: 400,
            headers: responseHeaders,
          }
        );
      }
      throw error;
    }

    const result = createRestaurantSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "入力内容が正しくありません",
          issues: result.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        },
        {
          status: 400,
          headers: responseHeaders,
        }
      );
    }

    const restaurant = await createRestaurant(result.data);

    return NextResponse.json<Restaurant>(
      restaurant,
      {
        status: 201,
        headers: responseHeaders,
      }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

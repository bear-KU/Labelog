import { NextResponse } from "next/server";

import { ForbiddenError } from "@/features/auth/services/authorization";
import {
  restaurantIdSchema,
  updateRestaurantSchema,
} from "@/features/restaurants/schemas/restaurant";
import {
  RestaurantNotFoundError,
  getRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from "@/features/restaurants/services/restaurants";
import type { Restaurant } from "@/features/restaurants/types";
import { UserServiceError } from "@/features/users/services/users";

type RestaurantRouteContext = {
  params: Promise<{ id: string }>;
}

const responseHeaders = {
  "Cache-Control": "private, no-store",
};

function invalidIdResponse() {
  return NextResponse.json(
    { error: "店舗 ID の形式が正しくありません"},
    {
      status: 400,
      headers: responseHeaders,
    }
  );
}

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
      }
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 403,
        headers: responseHeaders,
      }
    );
  }

  if (error instanceof RestaurantNotFoundError) {
    return NextResponse.json(
      { error: "店舗が見つかりません" },
      {
        status: 404,
        headers: responseHeaders,
      }
    );
  }

  console.error("Restaurant API failed:", error);

  return NextResponse.json(
    { error: "Internal Server Error" },
    {
      status: 500,
      headers: responseHeaders,
    }
  );
}

export async function GET(
  _request: Request,
  { params }: RestaurantRouteContext
) {
  try {
    const { id } = await params;
    const result = restaurantIdSchema.safeParse(id);

    if (!result.success) {
      return invalidIdResponse();
    }

    const restaurant = await getRestaurant(result.data);

    return NextResponse.json<Restaurant>(
      restaurant,
      { headers: responseHeaders }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: RestaurantRouteContext
) {
  try {
    const { id } = await params;
    const idResult = restaurantIdSchema.safeParse(id);

    if (!idResult.success) {
      return invalidIdResponse();
    }

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
    
    const result = updateRestaurantSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "入力内容が正しくありません",
          issues: result.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          }))
        },
        {
          status: 400,
          headers: responseHeaders,
        }
      );
    }

    const restaurant = await updateRestaurant(
      idResult.data,
      result.data
    );

    return NextResponse.json<Restaurant>(
      restaurant,
      { headers: responseHeaders }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: RestaurantRouteContext
) {
  try {
    const { id } = await params;
    const result = restaurantIdSchema.safeParse(id);

    if (!result.success) {
      return invalidIdResponse();
    }

    await deleteRestaurant(result.data);

    return new NextResponse(
      null,
      {
        status: 204,
        headers: responseHeaders,
      }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

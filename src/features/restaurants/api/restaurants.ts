import type {
  CreateRestaurantInput,
  Restaurant,
  UpdateRestaurantInput,
} from "@/features/restaurants/types";

type ValidationIssue = {
  path: (string | number)[];
  message: string;
}

type ApiErrorResponse = {
  error: string;
  issues?: ValidationIssue[];
}

export class RestaurantApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly issues: ValidationIssue[] = [],
  ) {
    super(message);
    this.name = "RestaurantApiError";
  }
}

const basePath = "/api/restaurants";

function restaurantPath(id: string): string {
  return `${basePath}/${encodeURIComponent(id)}`;
}

async function checkResponse(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }

  const body: ApiErrorResponse | null = await response
    .json()
    .catch(() => null);

  const message =
    typeof body?.error === "string"
      ? body.error
      : `店舗APIのリクエストに失敗しました (${response.status})`;

  throw new RestaurantApiError(
    response.status,
    message,
    body?.issues ?? [],
  );
}

export async function getRestaurants(
  signal?: AbortSignal,
): Promise<Restaurant[]> {
  const response = await fetch(
    basePath,
    {
      method: "GET",
      cache: "no-store",
      signal,
    }
  );

  await checkResponse(response);

  return response.json();
}

export async function getRestaurant(
  id: string,
  signal?: AbortSignal,
): Promise<Restaurant> {
  const response = await fetch(
    restaurantPath(id),
    {
      method: "GET",
      cache: "no-store",
      signal,
    }
  );

  await checkResponse(response);

  return response.json();
}

export async function createRestaurant(
  data: CreateRestaurantInput
): Promise<Restaurant> {
  const response = await fetch(
    basePath,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  await checkResponse(response);

  return response.json();
}

export async function updateRestaurant(
  id: string,
  data: UpdateRestaurantInput
): Promise<Restaurant> {
  const response = await fetch(
    restaurantPath(id),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  await checkResponse(response);

  return response.json();
}


export async function deleteRestaurant(
  id: string,
): Promise<void> {
  const response = await fetch(
    restaurantPath(id),
    {
      method: "DELETE",
    }
  );

  await checkResponse(response);
}

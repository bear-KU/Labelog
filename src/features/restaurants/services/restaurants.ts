import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { requireApprovedUser } from "@/features/auth/services/authorization";
import type {
  CreateRestaurantData,
  Restaurant,
  UpdateRestaurantData,
} from "@/features/restaurants/types";

import { db } from "@/lib/db";
import { restaurants } from "@/lib/db/schema";

export class RestaurantNotFoundError extends Error {
  constructor() {
    super("Restaurant not found");
    this.name = "RestaurantNotFoundError";
  }
}

function toRestaurant(row: typeof restaurants.$inferSelect): Restaurant {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function getRestaurants(): Promise<Restaurant[]> {
  await requireApprovedUser();

  const rows = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.isDeleted, false))
    .orderBy(desc(restaurants.createdAt), desc(restaurants.id));

  return rows.map(toRestaurant);
}

export async function getRestaurant(id: string): Promise<Restaurant> {
  await requireApprovedUser();

  const [row] = await db
    .select()
    .from(restaurants)
    .where(and(eq(restaurants.id, id), eq(restaurants.isDeleted, false)))
    .limit(1);

  if (!row) {
    throw new RestaurantNotFoundError();
  }

  return toRestaurant(row);
}

export async function createRestaurant(data: CreateRestaurantData): Promise<Restaurant> {
  await requireApprovedUser();

  const [row] = await db
    .insert(restaurants)
    .values(data)
    .returning();

  if (!row) {
    throw new Error("Failed to create restaurant");
  }

  return toRestaurant(row);
}

export async function updateRestaurant(id: string, data: UpdateRestaurantData): Promise<Restaurant> {
  await requireApprovedUser();

  const [row] = await db
    .update(restaurants)
    .set(data)
    .where(and(eq(restaurants.id, id), eq(restaurants.isDeleted, false)))
    .returning();

  if (!row) {
    throw new RestaurantNotFoundError();
  }

  return toRestaurant(row);
}

export async function deleteRestaurant(id: string): Promise<void> {
  await requireApprovedUser();

  const [row] = await db
    .update(restaurants)
    .set({ isDeleted: true })
    .where(and(eq(restaurants.id, id), eq(restaurants.isDeleted, false)))
    .returning({ id: restaurants.id });

  if (!row) {
    throw new RestaurantNotFoundError();
  }
}

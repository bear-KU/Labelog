import type { z } from "zod";

import type {
  createRestaurantSchema,
  updateRestaurantSchema,
} from "@/features/restaurants/schemas/restaurant";

import type { restaurants } from "@/lib/db/schema";

// API から返す店舗情報の型
// DB の型をもとに，ブラウザで使用する型に変換する
export type Restaurant = Omit<
  typeof restaurants.$inferSelect,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

// ブラウザから送信される店舗情報の型
export type CreateRestaurantInput = z.input<
  typeof createRestaurantSchema
>;

export type UpdateRestaurantInput = z.input<
  typeof updateRestaurantSchema
>;

// Zod 検証後の型
export type CreateRestaurantData = z.output<
  typeof createRestaurantSchema
>;

export type UpdateRestaurantData = z.output<
  typeof updateRestaurantSchema
>;

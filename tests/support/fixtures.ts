import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";

import { neon } from "@neondatabase/serverless";
import {
  expect,
  test as base,
  type APIRequest,
  type APIRequestContext,
} from "@playwright/test";

import type {
  CreateRestaurantInput,
  Restaurant,
} from "@/features/restaurants/types";
import type { AuthUser } from "@/features/users/types";

import {
  authFiles,
  testEnvironment,
} from "./environment";

type RestaurantFixture = {
  create: (
    input?: CreateRestaurantInput,
  ) => Promise<Restaurant>;
  findRow: (
    id: string,
  ) => Promise<Record<string, unknown> | undefined>;
};

type Fixtures = {
  approved: APIRequestContext;
  pending: APIRequestContext;
  restaurants: RestaurantFixture;
};

async function withAuthenticatedRequest(
  api: APIRequest,
  baseURL: string | undefined,
  file: string,
  isApproved: boolean,
  provide: (request: APIRequestContext) => Promise<void>,
): Promise<void> {
  if (!existsSync(file)) {
    throw new Error(
      "ログイン状態がありません．pnpm test:auth を実行してください",
    );
  }

  const request = await api.newContext({
    baseURL,
    storageState: file,
  });

  try {
    const response = await request.get("/api/users/me");

    expect(
      response.status(),
      "認証状態を確認できません．pnpm test:auth でログイン状態を保存し直してください",
    ).toBe(200);

    const user = (await response.json()) as AuthUser;

    expect(
      user.isApproved,
      "テスト用アカウントの承認状態が想定と異なります",
    ).toBe(isApproved);

    await provide(request);
  } finally {
    await request.dispose();
  }
}

export const test = base.extend<Fixtures>({
  approved: async ({ playwright, baseURL }, provide) => {
    await withAuthenticatedRequest(
      playwright.request,
      baseURL,
      authFiles.approved,
      true,
      provide,
    );
  },

  pending: async ({ playwright, baseURL }, provide) => {
    await withAuthenticatedRequest(
      playwright.request,
      baseURL,
      authFiles.pending,
      false,
      provide,
    );
  },

  restaurants: async ({ approved }, provide) => {
    const sql = neon(testEnvironment.DATABASE_URL);
    const createdIds = new Set<string>();

    try {
      await provide({
        async create(
          input = {
            name: `integration-${randomUUID()}`,
          },
        ) {
          const response = await approved.post(
            "/api/restaurants",
            { data: input },
          );

          const restaurant =
            (await response.json()) as Restaurant;

          if (typeof restaurant.id === "string") {
            createdIds.add(restaurant.id);
          }

          expect(response.status()).toBe(201);

          return restaurant;
        },

        async findRow(id) {
          const rows = await sql`
            SELECT *
            FROM public.restaurants
            WHERE id = ${id}
          `;

          return rows[0];
        },
      });
    } finally {
      for (const id of createdIds) {
        await sql`
          DELETE FROM public.restaurants
          WHERE id = ${id}
        `;
      }
    }
  },
});

export { expect } from "@playwright/test";

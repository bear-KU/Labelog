import { randomUUID } from "node:crypto";

import type { AuthUser } from "@/features/users/types";

import { expect, test } from "../support/fixtures";

test.describe("未ログイン", () => {
  for (const method of ["GET", "POST"] as const) {
    test(`${method} /api/users/me は 401 を返す`, async ({
      request,
    }) => {
      const response = await request.fetch(
        "/api/users/me",
        { method },
      );

      expect(response.status()).toBe(401);

      expect(await response.json()).toEqual({
        error: "User is not authenticated",
      });

      expect(response.headers()["cache-control"]).toBe(
        "private, no-store",
      );
    });
  }
});

for (const account of ["approved", "pending"] as const) {
  test.describe(
    account === "approved" ? "承認済み" : "未承認",
    () => {
      test("自分のユーザー情報を取得できる", async ({
        approved,
        pending,
      }) => {
        const client =
          account === "approved" ? approved : pending;

        const response = await client.get("/api/users/me");

        expect(response.status()).toBe(200);

        const user = (await response.json()) as AuthUser;

        expect(user).toEqual({
          id: expect.any(String),
          name: expect.any(String),
          isApproved: account === "approved",
          role: expect.any(String),
        });

        expect(user.id).not.toBe("");
        expect(user.name).not.toBe("");
        expect(["admin", "member"]).toContain(user.role);

        expect(response.headers()["cache-control"]).toBe(
          "private, no-store",
        );
      });

      test("初期化を再実行してもユーザー情報が変わらない", async ({
        approved,
        pending,
      }) => {
        const client =
          account === "approved" ? approved : pending;

        const beforeResponse = await client.get(
          "/api/users/me",
        );

        expect(beforeResponse.status()).toBe(200);

        const before =
          (await beforeResponse.json()) as AuthUser;

        for (let index = 0; index < 2; index += 1) {
          const response = await client.post(
            "/api/users/me",
          );

          expect(response.status()).toBe(200);
          expect(await response.json()).toEqual(before);
        }
      });

      test("初期化の本文でユーザー情報や権限を書き換えられない", async ({
        approved,
        pending,
      }) => {
        const client =
          account === "approved" ? approved : pending;

        const beforeResponse = await client.get(
          "/api/users/me",
        );

        expect(beforeResponse.status()).toBe(200);

        const before =
          (await beforeResponse.json()) as AuthUser;

        const response = await client.post(
          "/api/users/me",
          {
            data: {
              id: randomUUID(),
              name: "書き換えようとした名前",
              isApproved: !before.isApproved,
              role:
                before.role === "member"
                  ? "admin"
                  : "member",
            },
          },
        );

        expect(response.status()).toBe(200);
        expect(await response.json()).toEqual(before);

        const afterResponse = await client.get(
          "/api/users/me",
        );

        expect(afterResponse.status()).toBe(200);
        expect(await afterResponse.json()).toEqual(before);
      });
    },
  );
}

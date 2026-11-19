import { randomUUID } from "node:crypto";

import type {
  CreateRestaurantInput,
  Restaurant,
} from "@/features/restaurants/types";

import { expect, test } from "../support/fixtures";

const businessHours = {
  monday: {
    status: "open",
    periods: [
      {
        opensAt: "11:00",
        closesAt: "14:00",
      },
      {
        opensAt: "18:00",
        closesAt: "22:00",
      },
    ],
  },
  tuesday: {
    status: "closed",
  },
  wednesday: {
    status: "unknown",
  },
  thursday: {
    status: "unknown",
  },
  friday: {
    status: "open",
    periods: [
      {
        opensAt: "22:00",
        closesAt: "02:00",
        closesNextDay: true,
      },
    ],
  },
  saturday: {
    status: "unknown",
  },
  sunday: {
    status: "unknown",
  },
} satisfies NonNullable<
  CreateRestaurantInput["businessHours"]
>;

const expectedBusinessHours = {
  ...businessHours,
  monday: {
    status: "open",
    periods: businessHours.monday.periods.map(
      (period) => ({
        ...period,
        closesNextDay: false,
      }),
    ),
  },
};

const operations = [
  { label: "一覧取得", method: "GET", detail: false },
  { label: "詳細取得", method: "GET", detail: true },
  { label: "作成", method: "POST", detail: false },
  { label: "更新", method: "PATCH", detail: true },
  { label: "削除", method: "DELETE", detail: true },
] as const;

for (const account of ["guest", "pending"] as const) {
  test.describe(
    account === "guest" ? "未ログイン" : "未承認",
    () => {
      for (const operation of operations) {
        test(`${operation.label}を拒否する`, async ({
          request,
          pending,
          approved,
          restaurants,
        }) => {
          const restaurant = await restaurants.create();
          const before = await restaurants.findRow(
            restaurant.id,
          );

          const client =
            account === "guest" ? request : pending;

          const path = operation.detail
            ? `/api/restaurants/${restaurant.id}`
            : "/api/restaurants";

          const rejectedName =
            `拒否される店舗-${randomUUID()}`;

          const response = await client.fetch(path, {
            method: operation.method,
            ...(
              operation.method === "POST" ||
              operation.method === "PATCH"
                ? { data: { name: rejectedName } }
                : {}
            ),
          });

          expect(response.status()).toBe(
            account === "guest" ? 401 : 403,
          );

          expect(await response.json()).toEqual({
            error:
              account === "guest"
                ? "User is not authenticated"
                : "User is not approved",
          });

          expect(
            response.headers()["cache-control"],
          ).toBe("private, no-store");

          const after = await restaurants.findRow(
            restaurant.id,
          );

          expect(after).toEqual(before);

          if (operation.method === "POST") {
            const listResponse = await approved.get(
              "/api/restaurants",
            );

            expect(listResponse.status()).toBe(200);

            const list =
              (await listResponse.json()) as Restaurant[];

            expect(
              list.some(
                (item) => item.name === rejectedName,
              ),
            ).toBe(false);
          }
        });
      }
    },
  );
}

test.describe("承認済みの店舗 CRUD", () => {
  test("店名だけで登録するとデフォルト値が保存される", async ({
    approved,
    restaurants,
  }) => {
    const restaurant = await restaurants.create({
      name: "  店名だけの店舗  ",
    });

    expect(restaurant).toEqual({
      id: expect.any(String),
      name: "店名だけの店舗",
      address: null,
      genre: [],
      tags: [],
      businessHours: null,
      businessHoursNote: null,
      url: null,
      thumbnailPublicId: null,
      isDeleted: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    expect(restaurant.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    expect(
      Number.isNaN(Date.parse(restaurant.createdAt)),
    ).toBe(false);

    expect(
      Number.isNaN(Date.parse(restaurant.updatedAt)),
    ).toBe(false);

    const row = await restaurants.findRow(
      restaurant.id,
    );

    expect(row).toMatchObject({
      id: restaurant.id,
      name: "店名だけの店舗",
      address: null,
      genre: [],
      tags: [],
      business_hours: null,
      business_hours_note: null,
      is_deleted: false,
    });

    const response = await approved.get(
      `/api/restaurants/${restaurant.id}`,
    );

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(restaurant);
  });

  test("全項目と営業時間を保存して取得できる", async ({
    approved,
    restaurants,
  }) => {
    const restaurant = await restaurants.create({
      name: "営業時間を持つ店舗",
      address: "  京都市  ",
      genre: [" 和食 "],
      tags: [" ランチ "],
      businessHours,
      businessHoursNote: "  祝日は営業時間変更あり  ",
      url: " https://example.com/ ",
      thumbnailPublicId: " restaurants/test-thumbnail ",
    });

    expect(restaurant).toMatchObject({
      name: "営業時間を持つ店舗",
      address: "京都市",
      genre: ["和食"],
      tags: ["ランチ"],
      businessHours: expectedBusinessHours,
      businessHoursNote: "祝日は営業時間変更あり",
      url: "https://example.com/",
      thumbnailPublicId: "restaurants/test-thumbnail",
      isDeleted: false,
    });

    const row = await restaurants.findRow(
      restaurant.id,
    );

    expect(row).toMatchObject({
      address: "京都市",
      genre: ["和食"],
      tags: ["ランチ"],
      business_hours: expectedBusinessHours,
      business_hours_note: "祝日は営業時間変更あり",
      url: "https://example.com/",
      thumbnail_public_id: "restaurants/test-thumbnail",
    });

    const response = await approved.get(
      `/api/restaurants/${restaurant.id}`,
    );

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(restaurant);
  });

  test("一覧に作成した店舗が含まれる", async ({
    approved,
    restaurants,
  }) => {
    const first = await restaurants.create();
    const second = await restaurants.create();

    const response = await approved.get(
      "/api/restaurants",
    );

    expect(response.status()).toBe(200);

    const list =
      (await response.json()) as Restaurant[];

    expect(list).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: first.id }),
        expect.objectContaining({ id: second.id }),
      ]),
    );

    expect(
      list.every((restaurant) => !restaurant.isDeleted),
    ).toBe(true);

    expect(response.headers()["cache-control"]).toBe(
      "private, no-store",
    );
  });

  test("部分更新で指定していない項目を維持する", async ({
    approved,
    restaurants,
  }) => {
    const before = await restaurants.create({
      name: "更新前の店舗",
      address: "京都市",
      genre: ["和食"],
      tags: ["ランチ"],
      businessHours,
      businessHoursNote: "祝日は変更あり",
      url: "https://example.com/",
      thumbnailPublicId: "restaurants/test-thumbnail",
    });

    const response = await approved.patch(
      `/api/restaurants/${before.id}`,
      {
        data: {
          name: "  更新後の店舗  ",
        },
      },
    );

    expect(response.status()).toBe(200);

    const after =
      (await response.json()) as Restaurant;

    expect(after).toEqual({
      ...before,
      name: "更新後の店舗",
      updatedAt: expect.any(String),
    });

    expect(Date.parse(after.updatedAt)).toBeGreaterThanOrEqual(
      Date.parse(before.updatedAt),
    );

    const detailResponse = await approved.get(
      `/api/restaurants/${before.id}`,
    );

    expect(detailResponse.status()).toBe(200);
    expect(await detailResponse.json()).toEqual(after);

    const row = await restaurants.findRow(before.id);

    expect(row).toMatchObject({
      name: "更新後の店舗",
      address: "京都市",
      genre: ["和食"],
      tags: ["ランチ"],
    });
  });

  test("営業時間を後から登録できる", async ({
    approved,
    restaurants,
  }) => {
    const restaurant = await restaurants.create();

    const response = await approved.patch(
      `/api/restaurants/${restaurant.id}`,
      {
        data: {
          businessHours,
          businessHoursNote: "祝日は変更あり",
        },
      },
    );

    expect(response.status()).toBe(200);

    expect(await response.json()).toMatchObject({
      businessHours: expectedBusinessHours,
      businessHoursNote: "祝日は変更あり",
    });

    const row = await restaurants.findRow(
      restaurant.id,
    );

    expect(row).toMatchObject({
      business_hours: expectedBusinessHours,
      business_hours_note: "祝日は変更あり",
    });
  });

  test("任意項目を null に戻し，配列を空にできる", async ({
    approved,
    restaurants,
  }) => {
    const restaurant = await restaurants.create({
      name: "任意項目を持つ店舗",
      address: "京都市",
      genre: ["和食"],
      tags: ["ランチ"],
      businessHours,
      businessHoursNote: "祝日は変更あり",
      url: "https://example.com/",
      thumbnailPublicId: "restaurants/test-thumbnail",
    });

    const clearedFields = {
      address: null,
      genre: [],
      tags: [],
      businessHours: null,
      businessHoursNote: null,
      url: null,
      thumbnailPublicId: null,
    };

    const response = await approved.patch(
      `/api/restaurants/${restaurant.id}`,
      { data: clearedFields },
    );

    expect(response.status()).toBe(200);

    expect(await response.json()).toMatchObject({
      id: restaurant.id,
      name: restaurant.name,
      ...clearedFields,
    });

    const detailResponse = await approved.get(
      `/api/restaurants/${restaurant.id}`,
    );

    expect(detailResponse.status()).toBe(200);

    expect(
      await detailResponse.json(),
    ).toMatchObject(clearedFields);

    const row = await restaurants.findRow(
      restaurant.id,
    );

    expect(row).toMatchObject({
      address: null,
      genre: [],
      tags: [],
      business_hours: null,
      business_hours_note: null,
      url: null,
      thumbnail_public_id: null,
    });
  });

  test("削除は論理削除になり，以後の取得・更新・再削除は 404 になる", async ({
    approved,
    restaurants,
  }) => {
    const restaurant = await restaurants.create();

    const response = await approved.delete(
      `/api/restaurants/${restaurant.id}`,
    );

    expect(response.status()).toBe(204);
    expect(await response.text()).toBe("");

    const row = await restaurants.findRow(
      restaurant.id,
    );

    expect(row).toMatchObject({
      id: restaurant.id,
      is_deleted: true,
    });

    const listResponse = await approved.get(
      "/api/restaurants",
    );

    expect(listResponse.status()).toBe(200);

    const list =
      (await listResponse.json()) as Restaurant[];

    expect(
      list.some((item) => item.id === restaurant.id),
    ).toBe(false);

    for (const method of [
      "GET",
      "PATCH",
      "DELETE",
    ] as const) {
      const result = await approved.fetch(
        `/api/restaurants/${restaurant.id}`,
        {
          method,
          ...(method === "PATCH"
            ? { data: { name: "削除後の更新" } }
            : {}),
        },
      );

      expect(result.status()).toBe(404);

      expect(await result.json()).toEqual({
        error: "店舗が見つかりません",
      });
    }
  });
});

test.describe("入力検証", () => {
  const invalidCreateInputs = [
    {
      label: "店名なし",
      data: {},
    },
    {
      label: "空白だけの店名",
      data: { name: "   " },
    },
    {
      label: "空のジャンル",
      data: { name: "店舗", genre: [""] },
    },
    {
      label: "空のタグ",
      data: { name: "店舗", tags: [""] },
    },
    {
      label: "許可していない URL",
      data: {
        name: "店舗",
        url: "javascript:alert(1)",
      },
    },
    {
      label: "サーバー管理項目",
      data: {
        name: "店舗",
        isDeleted: true,
      },
    },
    {
      label: "不足した曜日",
      data: {
        name: "店舗",
        businessHours: {
          monday: { status: "closed" },
        },
      },
    },
  ];

  for (const input of invalidCreateInputs) {
    test(`POST は${input.label}を 400 にする`, async ({
      approved,
    }) => {
      const response = await approved.post(
        "/api/restaurants",
        { data: input.data },
      );

      expect(response.status()).toBe(400);

      expect(await response.json()).toMatchObject({
        error: "入力内容が正しくありません",
        issues: expect.any(Array),
      });
    });
  }

  const invalidUpdateInputs = [
    {
      label: "空の更新",
      data: {},
    },
    {
      label: "空白だけの店名",
      data: { name: "   " },
    },
    {
      label: "サーバー管理項目",
      data: { isDeleted: true },
    },
    {
      label: "不正な URL",
      data: { url: "ftp://example.com/" },
    },
    {
      label: "不足した曜日",
      data: {
        businessHours: {
          monday: { status: "closed" },
        },
      },
    },
  ];

  for (const input of invalidUpdateInputs) {
    test(`PATCH は${input.label}を拒否し，保存内容を維持する`, async ({
      approved,
      restaurants,
    }) => {
      const restaurant = await restaurants.create();
      const before = await restaurants.findRow(
        restaurant.id,
      );

      const response = await approved.patch(
        `/api/restaurants/${restaurant.id}`,
        { data: input.data },
      );

      expect(response.status()).toBe(400);

      expect(await response.json()).toMatchObject({
        error: "入力内容が正しくありません",
        issues: expect.any(Array),
      });

      const after = await restaurants.findRow(
        restaurant.id,
      );

      expect(after).toEqual(before);
    });
  }

  for (const method of ["POST", "PATCH"] as const) {
    test(`${method} は壊れた JSON を 400 にする`, async ({
      approved,
      restaurants,
    }) => {
      const restaurant =
        method === "PATCH"
          ? await restaurants.create()
          : undefined;

      const path = restaurant
        ? `/api/restaurants/${restaurant.id}`
        : "/api/restaurants";

      const response = await approved.fetch(path, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        data: Buffer.from('{"name":', "utf8"),
      });

      expect(response.status()).toBe(400);

      expect(await response.json()).toEqual({
        error: "JSON の形式が正しくありません",
      });

      if (restaurant) {
        const detailResponse = await approved.get(path);

        expect(detailResponse.status()).toBe(200);
        expect(
          await detailResponse.json(),
        ).toEqual(restaurant);
      }
    });
  }
});

test.describe("対象店舗の検証", () => {
  for (const method of [
    "GET",
    "PATCH",
    "DELETE",
  ] as const) {
    test(`${method} は不正な ID を 400 にする`, async ({
      approved,
    }) => {
      const response = await approved.fetch(
        "/api/restaurants/invalid-id",
        {
          method,
          ...(method === "PATCH"
            ? { data: { name: "更新後" } }
            : {}),
        },
      );

      expect(response.status()).toBe(400);

      expect(await response.json()).toEqual({
        error: "店舗 ID の形式が正しくありません",
      });
    });

    test(`${method} は存在しない ID を 404 にする`, async ({
      approved,
    }) => {
      const response = await approved.fetch(
        `/api/restaurants/${randomUUID()}`,
        {
          method,
          ...(method === "PATCH"
            ? { data: { name: "更新後" } }
            : {}),
        },
      );

      expect(response.status()).toBe(404);

      expect(await response.json()).toEqual({
        error: "店舗が見つかりません",
      });
    });
  }
});

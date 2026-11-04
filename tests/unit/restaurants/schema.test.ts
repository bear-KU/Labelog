import { describe, expect, it } from "vitest";
import type { z } from "zod";

import {
  businessHoursSchema,
  createRestaurantSchema,
  restaurantIdSchema,
  updateRestaurantSchema,
} from "@/features/restaurants/schemas/restaurant";

type BusinessHoursInput = z.input<typeof businessHoursSchema>;

function createWeek(
  monday: BusinessHoursInput["monday"] = { status: "unknown" },
): BusinessHoursInput {
  return {
    monday,
    tuesday: { status: "unknown" },
    wednesday: { status: "unknown" },
    thursday: { status: "unknown" },
    friday: { status: "unknown" },
    saturday: { status: "unknown" },
    sunday: { status: "unknown" },
  };
}

describe("createRestaurantSchema", () => {
  it("店名だけで登録できる", () => {
    expect(
      createRestaurantSchema.parse({ name: "テスト店舗" }),
    ).toEqual({ name: "テスト店舗" });
  });

  it("店名の前後の空白を除去する", () => {
    const result = createRestaurantSchema.parse({
      name: "  テスト店舗  ",
    });

    expect(result.name).toBe("テスト店舗");
  });

  it("任意項目に null を指定できる", () => {
    const input = {
      name: "テスト店舗",
      address: null,
      businessHours: null,
      businessHoursNote: null,
      url: null,
      thumbnailPublicId: null,
    };

    expect(createRestaurantSchema.parse(input)).toEqual(input);
  });

  it.each([
    {},
    { name: "" },
    { name: "   " },
  ])("店名がない入力を拒否する: %j", (input) => {
    expect(createRestaurantSchema.safeParse(input).success).toBe(false);
  });

  it.each([
    {
      field: "genre",
      message: "ジャンルを入力してください",
    },
    {
      field: "tags",
      message: "タグを入力してください",
    },
  ])("$field の空欄には対応するエラーメッセージを返す", ({
    field,
    message,
  }) => {
    const result = createRestaurantSchema.safeParse({
      name: "テスト店舗",
      [field]: ["   "],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: [field, 0],
            message,
          }),
        ]),
      );
    }
  });

  it.each([
    { field: "genre", limit: 20 },
    { field: "tags", limit: 30 },
  ])("$field は上限文字数まで許可し，超過を拒否する", ({
    field,
    limit,
  }) => {
    expect(
      createRestaurantSchema.safeParse({
        name: "テスト店舗",
        [field]: ["あ".repeat(limit)],
      }).success,
    ).toBe(true);

    expect(
      createRestaurantSchema.safeParse({
        name: "テスト店舗",
        [field]: ["あ".repeat(limit + 1)],
      }).success,
    ).toBe(false);
  });

  it.each([
    "https://example.com",
    "http://example.com",
  ])("HTTP と HTTPS の URL を許可する: %s", (url) => {
    expect(
      createRestaurantSchema.safeParse({
        name: "テスト店舗",
        url,
      }).success,
    ).toBe(true);
  });

  it.each([
    "URLではない文字列",
    "javascript:alert(1)",
    "ftp://example.com",
  ])("許可していない URL を拒否する: %s", (url) => {
    expect(
      createRestaurantSchema.safeParse({
        name: "テスト店舗",
        url,
      }).success,
    ).toBe(false);
  });

  it.each(["id", "isDeleted", "createdAt", "updatedAt"])(
    "サーバー管理項目を指定できない: %s",
    (field) => {
      expect(
        createRestaurantSchema.safeParse({
          name: "テスト店舗",
          [field]: "不正な指定",
        }).success,
      ).toBe(false);
    },
  );
});

describe("businessHoursSchema", () => {
  it("分割営業・定休日・不明を扱い，翌日フラグを補完する", () => {
    const input = createWeek({
      status: "open",
      periods: [
        { opensAt: "11:00", closesAt: "14:00" },
        { opensAt: "18:00", closesAt: "22:00" },
      ],
    });

    input.tuesday = { status: "closed" };

    const result = businessHoursSchema.parse(input);

    expect(result.monday).toEqual({
      status: "open",
      periods: [
        {
          opensAt: "11:00",
          closesAt: "14:00",
          closesNextDay: false,
        },
        {
          opensAt: "18:00",
          closesAt: "22:00",
          closesNextDay: false,
        },
      ],
    });

    expect(result.tuesday).toEqual({ status: "closed" });
    expect(result.wednesday).toEqual({ status: "unknown" });
  });

  it("翌日までの営業を許可する", () => {
    const input = createWeek({
      status: "open",
      periods: [
        {
          opensAt: "22:00",
          closesAt: "02:00",
          closesNextDay: true,
        },
      ],
    });

    expect(businessHoursSchema.parse(input).monday).toEqual(input.monday);
  });

  it.each([
    {
      opensAt: "25:00",
      closesAt: "14:00",
      closesNextDay: false,
    },
    {
      opensAt: "11時",
      closesAt: "14:00",
      closesNextDay: false,
    },
    {
      opensAt: "11:00",
      closesAt: "11:00",
      closesNextDay: false,
    },
    {
      opensAt: "18:00",
      closesAt: "11:00",
      closesNextDay: false,
    },
    {
      opensAt: "11:00",
      closesAt: "14:00",
      closesNextDay: true,
    },
  ])("不正な時刻・時間帯を拒否する: %j", (period) => {
    const input = createWeek({
      status: "open",
      periods: [period],
    });

    expect(businessHoursSchema.safeParse(input).success).toBe(false);
  });

  it("営業日の時間帯が空なら拒否する", () => {
    const input = createWeek({
      status: "open",
      periods: [],
    });

    expect(businessHoursSchema.safeParse(input).success).toBe(false);
  });

  it("営業時間を指定した場合は7曜日すべて必要", () => {
    const input: Partial<BusinessHoursInput> = createWeek();
    delete input.sunday;

    expect(businessHoursSchema.safeParse(input).success).toBe(false);
  });
});

describe("updateRestaurantSchema", () => {
  it("店名だけの部分更新を許可する", () => {
    expect(
      updateRestaurantSchema.parse({ name: "更新後の店舗" }),
    ).toEqual({ name: "更新後の店舗" });
  });

  it("営業時間と補足を null に戻せる", () => {
    const input = {
      businessHours: null,
      businessHoursNote: null,
    };

    expect(updateRestaurantSchema.parse(input)).toEqual(input);
  });

  it.each([
    {},
    { name: undefined },
    { name: "   " },
    { isDeleted: true },
  ])("空の更新・不正な更新を拒否する: %j", (input) => {
    expect(updateRestaurantSchema.safeParse(input).success).toBe(false);
  });
});

describe("restaurantIdSchema", () => {
  it("UUID を許可する", () => {
    expect(
      restaurantIdSchema.safeParse(
        "5dd90a69-9d5c-4f54-a869-30c1ef8738d5",
      ).success,
    ).toBe(true);
  });

  it.each(["", "invalid-id", "123"])("UUID 以外を拒否する: %j", (id) => {
    expect(restaurantIdSchema.safeParse(id).success).toBe(false);
  });
});

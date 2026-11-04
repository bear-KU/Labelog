import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET as GET_LIST,
  POST,
} from "@/app/api/restaurants/route";
import {
  DELETE,
  GET as GET_DETAIL,
  PATCH,
} from "@/app/api/restaurants/[id]/route";
import { ForbiddenError } from "@/features/auth/services/authorization";
import * as restaurantServices from "@/features/restaurants/services/restaurants";
import type { Restaurant } from "@/features/restaurants/types";
import { UserServiceError } from "@/features/users/services/users";

// テスト内でサーバー用モジュールを読み込めるようにする．
vi.mock("server-only", () => ({}));

// 接続設定を置き換え，実際の DB・認証サービスへ接続しない．
vi.mock("@/lib/db", () => ({
  db: {},
}));

vi.mock("@/features/auth/server", () => ({
  neonAuth: {},
}));

const restaurant: Restaurant = {
  id: "5dd90a69-9d5c-4f54-a869-30c1ef8738d5",
  name: "テスト店舗",
  address: null,
  genre: [],
  tags: [],
  businessHours: null,
  businessHoursNote: null,
  url: null,
  thumbnailPublicId: null,
  isDeleted: false,
  createdAt: "2026-11-03T00:00:00.000Z",
  updatedAt: "2026-11-03T00:00:00.000Z",
};

const listUrl = "http://localhost:3000/api/restaurants";
const detailUrl = `${listUrl}/${restaurant.id}`;

function createContext(id = restaurant.id) {
  return {
    params: Promise.resolve({ id }),
  };
}

function createJsonRequest(
  url: string,
  method: "POST" | "PATCH",
  body: unknown,
): Request {
  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.spyOn(restaurantServices, "getRestaurants")
    .mockResolvedValue([restaurant]);

  vi.spyOn(restaurantServices, "getRestaurant")
    .mockResolvedValue(restaurant);

  vi.spyOn(restaurantServices, "createRestaurant")
    .mockResolvedValue(restaurant);

  vi.spyOn(restaurantServices, "updateRestaurant")
    .mockResolvedValue(restaurant);

  vi.spyOn(restaurantServices, "deleteRestaurant")
    .mockResolvedValue(undefined);
});

describe("正常系のレスポンス", () => {
  it("一覧取得は 200 と店舗一覧を返す", async () => {
    const response = await GET_LIST();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([restaurant]);
    expect(response.headers.get("Cache-Control"))
      .toBe("private, no-store");
    expect(restaurantServices.getRestaurants)
      .toHaveBeenCalledTimes(1);
  });

  it("店舗がなければ 200 と空配列を返す", async () => {
    vi.mocked(restaurantServices.getRestaurants)
      .mockResolvedValueOnce([]);

    const response = await GET_LIST();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("詳細取得は ID をサービスへ渡し，200 を返す", async () => {
    const response = await GET_DETAIL(
      new Request(detailUrl),
      createContext(),
    );

    expect(restaurantServices.getRestaurant)
      .toHaveBeenCalledExactlyOnceWith(restaurant.id);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(restaurant);
  });

  it("作成は検証後の値をサービスへ渡し，201 を返す", async () => {
    const response = await POST(
      createJsonRequest(listUrl, "POST", {
        name: "  テスト店舗  ",
      }),
    );

    expect(restaurantServices.createRestaurant)
      .toHaveBeenCalledExactlyOnceWith({
        name: "テスト店舗",
      });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(restaurant);
  });

  it("更新は指定された項目だけをサービスへ渡し，200 を返す", async () => {
    const updatedRestaurant: Restaurant = {
      ...restaurant,
      name: "更新後の店舗",
      updatedAt: "2026-11-03T01:00:00.000Z",
    };

    vi.mocked(restaurantServices.updateRestaurant)
      .mockResolvedValueOnce(updatedRestaurant);

    const response = await PATCH(
      createJsonRequest(detailUrl, "PATCH", {
        name: "  更新後の店舗  ",
        businessHours: null,
      }),
      createContext(),
    );

    expect(restaurantServices.updateRestaurant)
      .toHaveBeenCalledExactlyOnceWith(restaurant.id, {
        name: "更新後の店舗",
        businessHours: null,
      });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(updatedRestaurant);
  });

  it("削除は ID をサービスへ渡し，本文なしの 204 を返す", async () => {
    const response = await DELETE(
      new Request(detailUrl, { method: "DELETE" }),
      createContext(),
    );

    expect(restaurantServices.deleteRestaurant)
      .toHaveBeenCalledExactlyOnceWith(restaurant.id);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });
});

const bodyRoutes = [
  {
    method: "POST" as const,
    url: listUrl,
    invoke: (request: Request) => POST(request),
    getMock: () => vi.mocked(restaurantServices.createRestaurant),
  },
  {
    method: "PATCH" as const,
    url: detailUrl,
    invoke: (request: Request) => PATCH(request, createContext()),
    getMock: () => vi.mocked(restaurantServices.updateRestaurant),
  },
];

describe.each(bodyRoutes)(
  "$method の入力検証",
  ({ method, url, invoke, getMock }) => {
    it("壊れた JSON は 400 になり，サービスを呼ばない", async () => {
      const request = new Request(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: "{",
      });

      const response = await invoke(request);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "JSON の形式が正しくありません",
      });
      expect(getMock()).not.toHaveBeenCalled();
    });

    it.each([
      {},
      { name: "   " },
      { name: "テスト店舗", isDeleted: true },
    ])("不正な入力は 400 になり，サービスを呼ばない: %j", async (body) => {
      const response = await invoke(
        createJsonRequest(url, method, body),
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "入力内容が正しくありません",
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: expect.any(Array),
            message: expect.any(String),
          }),
        ]),
      });
      expect(getMock()).not.toHaveBeenCalled();
    });
  },
);

const detailRoutes = [
  {
    name: "GET /api/restaurants/[id]",
    invoke: (id = restaurant.id) =>
      GET_DETAIL(
        new Request(`${listUrl}/${id}`),
        createContext(id),
      ),
    getMock: () => vi.mocked(restaurantServices.getRestaurant),
  },
  {
    name: "PATCH /api/restaurants/[id]",
    invoke: (id = restaurant.id) =>
      PATCH(
        createJsonRequest(`${listUrl}/${id}`, "PATCH", {
          name: "更新後の店舗",
        }),
        createContext(id),
      ),
    getMock: () => vi.mocked(restaurantServices.updateRestaurant),
  },
  {
    name: "DELETE /api/restaurants/[id]",
    invoke: (id = restaurant.id) =>
      DELETE(
        new Request(`${listUrl}/${id}`, { method: "DELETE" }),
        createContext(id),
      ),
    getMock: () => vi.mocked(restaurantServices.deleteRestaurant),
  },
];

describe.each(detailRoutes)(
  "$name の対象店舗の検証",
  ({ invoke, getMock }) => {
    it("不正な ID は 400 になり，サービスを呼ばない", async () => {
      const response = await invoke("invalid-id");

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "店舗 ID の形式が正しくありません",
      });
      expect(getMock()).not.toHaveBeenCalled();
    });

    it("店舗未検出の例外を 404 に変換する", async () => {
      getMock().mockRejectedValueOnce(
        new restaurantServices.RestaurantNotFoundError(),
      );

      const response = await invoke();

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        error: "店舗が見つかりません",
      });
      expect(getMock()).toHaveBeenCalledTimes(1);
    });
  },
);

const allRoutes = [
  {
    name: "GET /api/restaurants",
    invoke: () => GET_LIST(),
    getMock: () => vi.mocked(restaurantServices.getRestaurants),
  },
  {
    name: "POST /api/restaurants",
    invoke: () =>
      POST(
        createJsonRequest(listUrl, "POST", {
          name: "テスト店舗",
        }),
      ),
    getMock: () => vi.mocked(restaurantServices.createRestaurant),
  },
  ...detailRoutes,
];

const errorCases = [
  {
    reason: "未ログイン",
    error: new UserServiceError(
      "UNAUTHENTICATED",
      "User is not authenticated",
    ),
    status: 401,
    message: "User is not authenticated",
  },
  {
    reason: "未承認",
    error: new ForbiddenError(),
    status: 403,
    message: "User is not approved",
  },
  {
    reason: "アプリのユーザー情報が未登録",
    error: new UserServiceError(
      "USER_NOT_FOUND",
      "Authenticated user not found in the database",
    ),
    status: 404,
    message: "Authenticated user not found in the database",
  },
  {
    reason: "認証サービスのエラー",
    error: new UserServiceError(
      "AUTH_UNAVAILABLE",
      "Failed to retrieve auth session",
    ),
    status: 502,
    message: "Failed to retrieve auth session",
  },
  {
    reason: "予期しないエラー",
    error: new Error("Unexpected internal failure"),
    status: 500,
    message: "Internal Server Error",
  },
];

describe.each(allRoutes)(
  "$name の例外処理",
  ({ invoke, getMock }) => {
    it.each(errorCases)(
      "$reason の場合は $status を返す",
      async ({ error, status, message }) => {
        const logSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        getMock().mockRejectedValueOnce(error);

        const response = await invoke();

        expect(getMock()).toHaveBeenCalledTimes(1);
        expect(response.status).toBe(status);
        expect(await response.json()).toEqual({
          error: message,
        });
        expect(response.headers.get("Cache-Control"))
          .toBe("private, no-store");

        if (status === 500) {
          expect(logSpy).toHaveBeenCalledWith(
            expect.any(String),
            error,
          );
        } else {
          expect(logSpy).not.toHaveBeenCalled();
        }
      },
    );
  },
);

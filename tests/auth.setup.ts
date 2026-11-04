import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import { neon } from "@neondatabase/serverless";
import {
  expect,
  test,
  type APIRequestContext,
  type APIResponse,
} from "@playwright/test";

import type { AuthUser } from "@/features/users/types";

import {
  authFiles,
  requireTestEnv,
  testBaseURL,
  testEnvironment,
} from "./support/environment";

type TestAccount = {
  label: string;
  name: string;
  email: string;
  password: string;
  isApproved: boolean;
  file: string;
};

type AuthSession = {
  user: {
    id: string;
    email: string;
  };
};

const accounts: TestAccount[] = [
  {
    label: "承認済み",
    name: "integration-approved",
    email: requireTestEnv("TEST_APPROVED_EMAIL")
      .trim()
      .toLowerCase(),
    password: requireTestEnv("TEST_APPROVED_PASSWORD"),
    isApproved: true,
    file: authFiles.approved,
  },
  {
    label: "未承認",
    name: "integration-pending",
    email: requireTestEnv("TEST_PENDING_EMAIL")
      .trim()
      .toLowerCase(),
    password: requireTestEnv("TEST_PENDING_PASSWORD"),
    isApproved: false,
    file: authFiles.pending,
  },
];

if (accounts[0].email === accounts[1].email) {
  throw new Error(
    "承認済み・未承認には別のメールアドレスを設定してください",
  );
}

async function readErrorCode(
  response: APIResponse,
): Promise<string> {
  const body: unknown = await response
    .json()
    .catch(() => null);

  if (
    typeof body === "object" &&
    body !== null &&
    "code" in body &&
    typeof body.code === "string"
  ) {
    return body.code;
  }

  return "UNKNOWN";
}

async function assertAuthSuccess(
  response: APIResponse,
  operation: string,
): Promise<void> {
  if (response.ok()) {
    return;
  }

  const code = await readErrorCode(response);

  throw new Error(
    `${operation}に失敗しました (HTTP ${response.status()}, code: ${code})．` +
      "test ブランチのメール認証設定とテスト用の認証情報を確認してください",
  );
}

async function signIn(
  request: APIRequestContext,
  account: TestAccount,
): Promise<void> {
  const credentials = {
    email: account.email,
    password: account.password,
  };

  let response = await request.post(
    "/api/auth/sign-in/email",
    { data: credentials },
  );

  if (response.ok()) {
    return;
  }

  const code = await readErrorCode(response);

  if (
    response.status() !== 401 ||
    code !== "INVALID_EMAIL_OR_PASSWORD"
  ) {
    await assertAuthSuccess(response, "ログイン");
    return;
  }

  const signUpResponse = await request.post(
    "/api/auth/sign-up/email",
    {
      data: {
        ...credentials,
        name: account.name,
      },
    },
  );

  await assertAuthSuccess(
    signUpResponse,
    "テスト用アカウントの登録",
  );

  response = await request.post(
    "/api/auth/sign-in/email",
    { data: credentials },
  );

  await assertAuthSuccess(response, "登録後のログイン");
}

for (const account of accounts) {
  test(`${account.label}の認証状態を準備する`, async ({
    playwright,
  }) => {
    const request = await playwright.request.newContext({
      baseURL: testBaseURL,
      extraHTTPHeaders: {
        Origin: new URL(testBaseURL).origin,
      },
      storageState: {
        cookies: [],
        origins: [],
      },
    });

    try {
      await signIn(request, account);

      const sessionResponse = await request.get(
        "/api/auth/get-session",
      );

      expect(sessionResponse.status()).toBe(200);

      const session =
        (await sessionResponse.json()) as AuthSession | null;

      expect(
        session?.user?.id,
        "ログイン後の Cookie でセッションを取得できません",
      ).toEqual(expect.any(String));

      if (!session?.user) {
        throw new Error("認証セッションを取得できませんでした");
      }

      expect(session.user.email.toLowerCase()).toBe(
        account.email,
      );

      const initializeResponse = await request.post(
        "/api/users/me",
      );

      expect(
        initializeResponse.status(),
        "アプリ側のユーザー初期化に失敗しました",
      ).toBe(200);

      const initializedUser =
        (await initializeResponse.json()) as AuthUser;

      expect(initializedUser.id).toBe(session.user.id);

      const sql = neon(testEnvironment.DATABASE_URL);

      const rows = await sql`
        UPDATE public.users
        SET
          is_approved = ${account.isApproved},
          role = 'member',
          updated_at = now()
        WHERE id = ${initializedUser.id}
        RETURNING id
      `;

      expect(
        rows.length,
        "テスト用 DB に対象ユーザーが見つかりません",
      ).toBe(1);

      const userResponse = await request.get(
        "/api/users/me",
      );

      expect(userResponse.status()).toBe(200);

      const user =
        (await userResponse.json()) as AuthUser;

      expect(user).toMatchObject({
        id: initializedUser.id,
        isApproved: account.isApproved,
        role: "member",
      });

      await mkdir(dirname(account.file), {
        recursive: true,
      });

      await request.storageState({
        path: account.file,
      });
    } finally {
      await request.dispose();
    }
  });
}

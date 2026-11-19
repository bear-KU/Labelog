import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";

const values = parseEnv(
  readFileSync(resolve(".env.test.local"), "utf8"),
);

export function requireTestEnv(name: string): string {
  const value = values[name];

  if (!value?.trim()) {
    throw new Error(`${name} is not set in .env.test.local`);
  }

  return value;
}

export const testEnvironment = {
  DATABASE_URL: requireTestEnv("DATABASE_URL"),
  DATABASE_URL_UNPOOLED: requireTestEnv("DATABASE_URL_UNPOOLED"),
  NEON_AUTH_BASE_URL: requireTestEnv("NEON_AUTH_BASE_URL"),
  NEON_AUTH_COOKIE_SECRET: requireTestEnv("NEON_AUTH_COOKIE_SECRET"),
};

export const testBaseURL = "http://localhost:3100";

export const authFiles = {
  approved: resolve("tests/.auth/approved.json"),
  pending: resolve("tests/.auth/pending.json"),
};

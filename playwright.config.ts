import { defineConfig, devices } from "@playwright/test";

import {
  testBaseURL,
  testEnvironment,
} from "./tests/support/environment";

export default defineConfig({
  testDir: "./tests",

  timeout: 60_000,

  expect: {
    timeout: 10_000,
  },

  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,

  reporter: [
    ["list"],
    ["html", { open: "never" }],
  ],

  use: {
    baseURL: testBaseURL,
    storageState: {
      cookies: [],
      origins: [],
    },
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "auth-setup",
      testMatch: "**/auth.setup.ts",
      timeout: 120_000,
      use: {
        trace: "off",
        screenshot: "off",
        video: "off",
      },
    },
    {
      name: "chromium",
      testMatch: [
        "**/integration/**/*.spec.ts",
        "**/e2e/**/*.spec.ts",
      ],
      dependencies: ["auth-setup"],
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],

  webServer: {
    command: "pnpm build && pnpm start --port 3100",
    url: `${testBaseURL}/login`,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",

    env: {
      NODE_ENV: "production",
      ...testEnvironment,
    },
  },
});

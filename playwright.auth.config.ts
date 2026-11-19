import { defineConfig } from "@playwright/test";

import baseConfig from "./playwright.config";

export default defineConfig({
  ...baseConfig,

  testMatch: "**/auth.setup.ts",

  timeout: 600_000,
  workers: 1,
  retries: 0,
  maxFailures: 1,

  reporter: [["list"]],

  projects: [
    {
      name: "auth-setup",
      use: {
        browserName: "chromium",
        headless: false,
        storageState: {
          cookies: [],
          origins: [],
        },
        trace: "off",
        screenshot: "off",
        video: "off",
      },
    },
  ],
});

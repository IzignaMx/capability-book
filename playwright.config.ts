import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:4333";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    launchOptions: {
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
    },
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "pnpm build && pnpm preview --host 127.0.0.1 --port 4333",
    env: {
      PUBLIC_DIAGNOSTIC_ENDPOINT: "https://forms.test/diagnostic",
      PUBLIC_ENABLE_TEST_HOOKS: "true"
    },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: devices["Desktop Chrome"]
    }
  ]
});

import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const productionHost = "wisal-self.vercel.app";

if (new URL(baseURL).hostname === productionHost && process.env.E2E_ALLOW_PRODUCTION !== "enabled") {
  throw new Error("Refusing to run E2E tests against production. Set E2E_ALLOW_PRODUCTION=enabled only for read-only smoke tests.");
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { outputFolder: "output/playwright/report", open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  outputDir: "output/playwright/artifacts",
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
  ],
});

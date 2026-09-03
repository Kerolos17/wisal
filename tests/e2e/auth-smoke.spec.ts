import { expect, test } from "@playwright/test";

test.describe("authentication public smoke", () => {
  test("renders the email sign-in path without caching it", async ({ page }) => {
    const response = await page.goto("/auth/sign-in?returnTo=%2Fworkspace", { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(200);
    expect(response?.headers()["cache-control"]).toMatch(/private|no-store/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("link", { name: /forgot|نسيت/i })).toBeVisible();
  });

  test("renders recovery without submitting an email", async ({ page }) => {
    const response = await page.goto("/auth/forgot-password?returnTo=%2Fworkspace", { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(200);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /send|إرسال/i })).toBeVisible();
  });

  test("rejects an external callback destination", async ({ page }) => {
    await page.goto("/auth/callback?returnTo=%2F%2Fexample.com", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/wisal-self\.vercel\.app\/$/);
  });
});

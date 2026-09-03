import { expect, test } from "@playwright/test";

test.describe("public production-safe smoke", () => {
  test("renders the product entry point with canonical metadata", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveTitle(/Wisal/i);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    await expect(canonical).toHaveAttribute("href", /^https:\/\/[^/]+$/);
  });

  test("publishes an invite-safe crawler policy", async ({ request, baseURL }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toMatch(/Disallow: \/invite\//);

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const sitemapText = await sitemap.text();
    expect(sitemapText).toContain(new URL("/", baseURL).origin);
    expect(sitemapText).not.toMatch(/\/invite\//);
  });

  test("does not index or leak a private invitation query token", async ({ page }) => {
    await page.goto("/invite/e2e-private-probe?g=not-a-real-token", { waitUntil: "domcontentloaded" });

    const robots = await page.locator('meta[name="robots"]').evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("content") || ""),
    );
    expect(robots.length).toBeGreaterThan(0);
    expect(robots.every((content) => /noindex/i.test(content))).toBe(true);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/invite\/e2e-private-probe$/);
    await expect(page.locator('link[rel="canonical"]')).not.toHaveAttribute("href", /[?&]g=/);
  });
});

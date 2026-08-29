import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const guard = await readFile(new URL("../lib/public-api-guard.ts", import.meta.url), "utf8");
const rsvp = await readFile(new URL("../app/api/rsvp/route.ts", import.meta.url), "utf8");
const invitationOpen = await readFile(new URL("../app/api/invitation-open/route.ts", import.meta.url), "utf8");
const health = await readFile(new URL("../app/api/health/route.ts", import.meta.url), "utf8");
const media = await readFile(new URL("../app/api/media/[...key]/route.ts", import.meta.url), "utf8");
const legal = await readFile(new URL("../app/legal-document.tsx", import.meta.url), "utf8");
const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const sitemap = await readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8");
const nextConfig = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
const requestValidation = await readFile(new URL("../lib/request-validation.ts", import.meta.url), "utf8");

const jsonRouteFiles = [
  "admin/content/[key]/route.ts", "admin/payment-destinations/route.ts", "admin/plans/[code]/route.ts",
  "admin/support-tickets/[id]/route.ts", "admin/templates/[code]/route.ts", "admin/users/[id]/route.ts",
  "admin/payments/[id]/approve/route.ts", "admin/payments/[id]/reject/route.ts", "admin/payments/[id]/request-info/route.ts",
  "events/route.ts", "events/[id]/route.ts", "events/[id]/guest-groups/route.ts", "events/[id]/guest-groups/[groupId]/route.ts",
  "events/[id]/guests/route.ts", "events/[id]/guests/[guestId]/route.ts", "events/[id]/guests/import/route.ts",
  "events/[id]/messages/route.ts", "events/[id]/segments/route.ts", "events/[id]/segments/[segmentId]/route.ts",
  "invitation-open/route.ts", "payments/route.ts", "rsvp/route.ts", "support-tickets/route.ts",
];
const jsonRoutes = await Promise.all(jsonRouteFiles.map(async (file) => ({
  file,
  source: await readFile(new URL(`../app/api/${file}`, import.meta.url), "utf8"),
})));

test("public mutations reject oversized, cross-origin, and excessive requests", () => {
  assert.match(guard, /invalid_content_type/);
  assert.match(guard, /payload_too_large/);
  assert.match(guard, /origin_not_allowed/);
  assert.match(guard, /rate_limited/);
  assert.match(guard, /Retry-After/);
  assert.match(guard, /request\.clone\(\)\.text\(\)/);
  assert.match(guard, /getSql\(\)/);
  assert.match(guard, /INSERT INTO rate_limit_windows AS windows/);
  assert.doesNotMatch(guard, /new Map<string, RateWindow>/);
  assert.match(rsvp, /await guardPublicJsonRequest\(request, \{ limit: 10/);
  assert.match(invitationOpen, /await guardPublicJsonRequest\(request, \{ limit: 30/);
});

test("health check reports application and database state without configuration details", () => {
  assert.match(health, /select 1 as healthy/);
  assert.match(health, /status: "degraded"/);
  assert.match(health, /Cache-Control/);
  assert.doesNotMatch(health, /DATABASE_URL/);
});

test("security headers include a production CSP scoped to application resources", () => {
  assert.match(nextConfig, /Content-Security-Policy/);
  assert.match(nextConfig, /default-src 'self'/);
  assert.match(nextConfig, /connect-src 'self'/);
  assert.match(nextConfig, /frame-src 'self'/);
  assert.match(nextConfig, /object-src 'none'/);
  assert.match(nextConfig, /process\.env\.NODE_ENV === "development"/);
});

test("every JSON endpoint uses the bounded object reader", () => {
  assert.match(requestValidation, /DEFAULT_MAX_JSON_BYTES = 64 \* 1024/);
  assert.match(requestValidation, /invalid_json/);
  assert.match(requestValidation, /invalid_json_object/);
  assert.match(requestValidation, /request\.text\(\)/);
  for (const { file, source } of jsonRoutes) {
    assert.match(source, /readJsonBody\(request\)/, file);
    assert.doesNotMatch(source, /request\.json\(\)/, file);
  }
});

test("public media is limited to generated invitation covers", () => {
  assert.match(media, /isPublicCover/);
  assert.match(media, /\^covers\\\//);
  assert.match(media, /x-content-type-options/);
  assert.doesNotMatch(media, /getBucket\(\)\.get\(joined\)[\s\S]*receipts/);
});

test("bilingual trust pages explain privacy, terms, support, and payment status", () => {
  assert.match(legal, /سياسة الخصوصية/);
  assert.match(legal, /Privacy policy/);
  assert.match(legal, /شروط الاستخدام/);
  assert.match(legal, /Terms of use/);
  assert.match(legal, /Plans are paid manually using the transfer method shown at checkout/);
  assert.match(legal, /section%3Dsupport/);
  assert.match(page, /href="\/privacy"/);
  assert.match(page, /href="\/terms"/);
  assert.match(sitemap, /`\$\{siteUrl\}\/privacy`/);
  assert.match(sitemap, /`\$\{siteUrl\}\/terms`/);
});

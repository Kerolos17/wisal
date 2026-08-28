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

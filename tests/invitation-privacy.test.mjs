import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [invitePage, robots, sitemap, nextConfig, invitationClient, openRoute] = await Promise.all([
  read("app/invite/[slug]/page.tsx"),
  read("app/robots.ts"),
  read("app/sitemap.ts"),
  read("next.config.ts"),
  read("app/invite/[slug]/InvitationClient.tsx"),
  read("app/api/invitation-open/route.ts"),
]);

test("invitation metadata is private and query-safe by default", () => {
  assert.match(invitePage, /export async function generateMetadata/);
  assert.match(invitePage, /index: false/);
  assert.match(invitePage, /follow: false/);
  assert.match(invitePage, /noimageindex: true/);
  assert.match(invitePage, /const canonicalPath = `\/invite\/\$\{encodeURIComponent\(slug\)\}`/);
  assert.match(invitePage, /alternates: \{ canonical: canonicalPath \}/);
  assert.match(invitePage, /openGraph:[\s\S]*?url: canonicalPath/);
  assert.doesNotMatch(invitePage, /data\.event|data\.guest|inviteToken/);
});

test("robots and sitemap keep invitation URLs out of crawler discovery", () => {
  assert.match(robots, /allow: \["\/"\]/);
  assert.match(robots, /"\/invite\/"/);
  assert.doesNotMatch(robots, /allow: \["\/", "\/invite\/"\]/);
  assert.doesNotMatch(sitemap, /\/invite\//);
});

test("invitation responses prevent indexing and referrer leakage", () => {
  assert.match(nextConfig, /source: "\/invite\/:path\*"/);
  assert.match(nextConfig, /X-Robots-Tag.*noindex, nofollow, noimageindex/);
  assert.match(nextConfig, /Referrer-Policy.*no-referrer/);
  assert.ok(nextConfig.indexOf('source: "/:path*"') < nextConfig.indexOf('source: "/invite/:path*"'));
  assert.match(invitationClient, /body: JSON\.stringify\(\{ eventId: event\.id, inviteToken: guest\.inviteToken \}\)/);
  assert.doesNotMatch(openRoute, /console\.|request\.url|request\.nextUrl/);
});

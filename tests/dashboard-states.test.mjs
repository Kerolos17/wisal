import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("D-Phase 3: studio offers all templates with premium locks intact", () => {
  assert.doesNotMatch(page, /studio-templates[^]*?templates\.slice\(0, 6\)/);
  assert.match(page, /studio-templates[^]*?templates\.map\(\(template, i\)/s);
  assert.match(page, /disabled=\{isPremiumTemplate\(template\) && !hasPaidPlan\}/);
  assert.match(page, /data-locked=\{isPremiumTemplate\(template\) && !hasPaidPlan\}/);
  assert.match(page, /template-upgrade-notice/);
});

test("D-Phase 3: activity has an empty state and breadcrumb context exists", () => {
  assert.match(page, /لا نشاط بعد/);
  assert.match(page, /No activity yet/);
  assert.match(page, /updates and responses will appear here/i);
  assert.match(page, /workspace-breadcrumb/);
  assert.match(page, /empty-guests/);
});

test("D-Phase 3: premium entitlement source unchanged (6 codes)", async () => {
  const entitlements = await readFile(new URL("../lib/template-entitlements.ts", import.meta.url), "utf8");
  for (const code of ["cinema-night", "velvet-night", "moonlight", "golden-vows", "cathedral-light", "coastal-breeze"]) {
    assert.match(entitlements, new RegExp(`"${code}"`));
  }
});

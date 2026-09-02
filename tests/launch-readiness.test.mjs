import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const headers = await readFile(new URL("../public/_headers", import.meta.url), "utf8");
const robots = await readFile(new URL("../app/robots.ts", import.meta.url), "utf8");
const errorPage = await readFile(new URL("../app/error.tsx", import.meta.url), "utf8");
const ciWorkflow = await readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");

test("dashboard gives event owners a concrete launch-readiness checklist", () => {
  assert.match(page, /const launchChecks = \[/);
  assert.match(page, /const launchScore = launchChecks\.filter/);
  assert.match(page, /Invitation launch readiness/);
  assert.match(page, /Locations & stages/);
  assert.match(styles, /\.launch-checks\{display:grid/);
  assert.match(page, /transform: `scaleX\(\$\{launchScore \/ 100\}\)`/);
  assert.doesNotMatch(styles, /transition:[^;}]*width/);
});

test("production metadata supports discovery without indexing private routes", () => {
  assert.match(layout, /metadataBase: new URL/);
  assert.match(layout, /openGraph:/);
  assert.match(robots, /disallow: \["\/admin", "\/workspace", "\/api\/", "\/invite\/"\]/);
});

test("edge headers and route recovery states improve launch resilience", () => {
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /Permissions-Policy: camera=\(\), microphone=\(\), geolocation=\(\)/);
  assert.match(headers, /Cache-Control: public, max-age=31536000, immutable/);
  assert.match(errorPage, /reset: \(\) => void/);
  assert.match(errorPage, /Try again/);
});

test("continuous integration protects every pull request with the product quality gates", () => {
  assert.match(ciWorkflow, /pull_request:/);
  assert.match(ciWorkflow, /node-version: 22/);
  assert.match(ciWorkflow, /npm ci/);
  assert.match(ciWorkflow, /node --test tests\/\*\.test\.mjs/);
  assert.match(ciWorkflow, /npm run lint/);
  assert.match(ciWorkflow, /npx tsc --noEmit/);
  assert.match(ciWorkflow, /npm run build/);
});

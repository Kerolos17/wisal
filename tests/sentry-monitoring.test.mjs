import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const smokeRoute = await readFile(new URL("../app/api/ops/sentry-smoke/route.ts", import.meta.url), "utf8");
const sentryGuide = await readFile(new URL("../docs/operations/SENTRY_SETUP.md", import.meta.url), "utf8");

test("Sentry smoke endpoint is preview-only and token guarded", () => {
  assert.match(smokeRoute, /process\.env\.VERCEL_ENV !== "preview"/);
  assert.match(smokeRoute, /SENTRY_SMOKE_TEST_TOKEN/);
  assert.match(smokeRoute, /authorization/);
  assert.match(smokeRoute, /timingSafeEqual/);
  assert.match(smokeRoute, /status: 404/);
  assert.match(smokeRoute, /Sentry\.flush\(2000\)/);
});

test("Sentry runbook keeps the smoke test out of production", () => {
  assert.match(sentryGuide, /Preview only/);
  assert.match(sentryGuide, /Do not run this check against production/);
});

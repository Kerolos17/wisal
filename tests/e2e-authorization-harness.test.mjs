import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const identity = await readFile(new URL("../lib/auth/e2e-test-identity.ts", import.meta.url), "utf8");
const platformIdentity = await readFile(new URL("../lib/auth/identity.ts", import.meta.url), "utf8");
const config = await readFile(new URL("../playwright.config.ts", import.meta.url), "utf8");
const suite = await readFile(new URL("./e2e/authorization-isolation.spec.ts", import.meta.url), "utf8");

test("mutable E2E identity is explicitly test-only and fails closed in production", () => {
  assert.match(identity, /WISAL_E2E_TEST_MODE === "enabled"/);
  assert.match(identity, /process\.env\.NODE_ENV !== "production"/);
  assert.match(identity, /WISAL_E2E_TEST_TOKEN/);
  assert.match(identity, /timingSafeEqual/);
  assert.match(identity, /@[^\\s@]+\\\.invalid/);
  assert.match(platformIdentity, /await getE2ETestIdentity\(\)/);
});

test("mutable E2E refuses production and exercises owner substitution", () => {
  assert.match(config, /Mutable authorization E2E tests must never target production/);
  assert.match(config, /WISAL_E2E_TEST_TOKEN is required/);
  assert.match(suite, /owner B cannot discover, read, or mutate owner A/);
  assert.match(suite, /\/api\/events\/\$\{eventId\}/);
  assert.match(suite, /\/guests/);
  assert.match(suite, /\/messages/);
  assert.match(suite, /\/api\/admin\/overview/);
  assert.match(suite, /mode: "serial"/);
  assert.match(suite, /test\.setTimeout\(180_000\)/);
});

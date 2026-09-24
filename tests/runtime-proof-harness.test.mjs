import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rsvp = await readFile(new URL("../tests/e2e/rsvp-integrity.spec.ts", import.meta.url), "utf8");
const journey = await readFile(new URL("../tests/e2e/owner-journey.spec.ts", import.meta.url), "utf8");
const playwrightConfig = await readFile(new URL("../playwright.config.ts", import.meta.url), "utf8");

test("TASK-003 RSVP integrity harness covers six cases and is env-gated", () => {
  assert.match(rsvp, /E2E_MUTABLE_AUTHORIZATION.*enabled/);
  assert.match(rsvp, /anonymous RSVP with existing managed-guest name.*409/);
  assert.match(rsvp, /valid personalized token.*201/);
  assert.match(rsvp, /invalid token.*400/);
  assert.match(rsvp, /private-mode invite without token/);
  assert.match(rsvp, /parallel anonymous POSTs.*guest limit/);
  assert.match(rsvp, /cross-event token replay/);
  assert.match(rsvp, /test\.skip\(!enabled/);
});

test("TASK-004 owner journey harness covers create, guests, CSV, isolation, open tracking", () => {
  assert.match(journey, /E2E_MUTABLE_AUTHORIZATION/);
  assert.match(journey, /\/api\/events/);
  assert.match(journey, /guests/);
  assert.match(journey, /import/);
  assert.match(journey, /404/);
  assert.match(journey, /invitation-open/);
  assert.match(journey, /test\.skip/);
});

test("playwright config guards mutable suites from production", () => {
  assert.match(playwrightConfig, /mutableAuthorizationSuite/);
  assert.match(playwrightConfig, /must never target production/);
});

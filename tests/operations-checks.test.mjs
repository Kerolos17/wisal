import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const backupRunbook = await readFile(new URL("../docs/operations/BACKUP_RUNBOOK.md", import.meta.url), "utf8");
const domainChecklist = await readFile(new URL("../docs/operations/DOMAIN_PAYMENT_CHECKLIST.md", import.meta.url), "utf8");
const payments = await readFile(new URL("../lib/payments.ts", import.meta.url), "utf8");
const smoke = await readFile(new URL("../app/api/ops/sentry-smoke/route.ts", import.meta.url), "utf8");
const instrumentation = await readFile(new URL("../instrumentation.ts", import.meta.url), "utf8");

test("TASK-005 backup runbook defines retention, RPO/RTO, and synthetic drill", () => {
  assert.match(backupRunbook, /Point-in-time recovery/);
  assert.match(backupRunbook, /RPO/);
  assert.match(backupRunbook, /RTO/);
  assert.match(backupRunbook, /Sentry smoke/);
  assert.match(backupRunbook, /VERCEL_ENV.*preview/);
});

test("TASK-005 smoke endpoint is preview-only, token-gated, and flushed", () => {
  assert.match(smoke, /VERCEL_ENV.*preview/);
  assert.match(smoke, /SENTRY_SMOKE_TEST_TOKEN/);
  assert.match(smoke, /timingSafeEqual/);
  assert.match(smoke, /Sentry\.captureException/);
  assert.match(smoke, /Sentry\.flush/);
  assert.match(instrumentation, /logger\.info.*nextjs_server_started/);
});

test("TASK-007 domain/payment/legal checklist exists and payment code guards snapshots", () => {
  assert.match(domainChecklist, /NEXT_PUBLIC_SITE_URL/);
  assert.match(domainChecklist, /payment_destinations/);
  assert.match(domainChecklist, /LEGAL-001|counsel/i);
  assert.match(payments, /priceEgpSnapshot/);
  assert.match(payments, /Plan price has changed/);
  assert.match(payments, /Payment amount does not match/);
});

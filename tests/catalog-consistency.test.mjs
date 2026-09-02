import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [page, seed, fixture, migration, adminData, checkout, payments] = await Promise.all([
  read("app/page.tsx"),
  read("db/seeds/0001_platform_catalog.sql"),
  read("tests/helpers/payment-test-data.ts"),
  read("db/neon-migrations/0017_platform_catalog_prices.sql"),
  read("lib/admin-data.ts"),
  read("app/checkout/page.tsx"),
  read("lib/payments.ts"),
]);

test("the public catalog uses the database and fails closed when unavailable", () => {
  assert.match(page, /useState<PublicPlan\[\]>\(\[\]\)/);
  assert.match(page, /setCatalogState\("ready"\)/);
  assert.match(page, /setCatalogState\("unavailable"\)/);
  assert.match(page, /catalogState === "unavailable"/);
  assert.match(page, /plans and pricing are temporarily unavailable/i);
  assert.doesNotMatch(page, /priceEgp: (?:0|899)/);
});

test("bootstrap and payment fixtures carry the approved EGP catalog", () => {
  for (const source of [seed, fixture]) {
    assert.match(source, /starter[^\n]+(?:199|priceEgp: 199)/i);
    assert.match(source, /elegant[^\n]+(?:599|priceEgp: 599)/i);
    assert.match(source, /signature[^\n]+(?:1699|priceEgp: 1699)/i);
    assert.doesNotMatch(source, /(?:priceEgp:\s*(?:0|899)|,\s*(?:0|899),)/);
  }
});

test("runtime pricing has one source of truth and payment snapshots are immutable", () => {
  assert.match(migration, /price_egp = CASE code/);
  assert.match(migration, /price_egp = 0/);
  assert.match(migration, /price_egp = 899/);
  assert.match(migration, /WHEN 'starter' THEN 199/);
  assert.match(migration, /WHEN 'elegant' THEN 599/);
  assert.match(adminData, /from\(platformPlans\)/);
  assert.match(adminData, /priceEgp: platformPlans\.priceEgp/);
  assert.match(checkout, /priceEgp: existingPayment\?\.priceEgpSnapshot \?\? planRow\.priceEgp/);
  assert.match(payments, /priceEgpSnapshot: plan\.priceEgp/);
  assert.match(payments, /details\.amountPaid !== request\.priceEgpSnapshot/);
});

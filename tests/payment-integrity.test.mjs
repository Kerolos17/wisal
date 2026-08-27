import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

describe("manual payment integrity contracts", () => {
  it("checks ownership and upload limits before storing a receipt", () => {
    const source = read("app/api/payments/[id]/submit/route.ts");
    assert.match(source, /content-length/);
    assert.match(source, /file\.size > MAX_RECEIPT_BYTES/);
    assert.ok(source.indexOf("getOwnPaymentRequest(identity, id)") < source.indexOf("storeReceipt("));
    assert.match(source, /amount !== payment\.priceEgpSnapshot/);
    assert.match(source, /storeReceipt\(payment\.userId, id/);
  });

  it("uses a transaction and status guards for approval", () => {
    const source = read("lib/payments.ts");
    assert.match(source, /onConflictDoNothing\(\{ target: paymentRequests\.idempotencyKey \}\)/);
    assert.match(source, /sqlClient\.transaction\(\[/);
    assert.match(source, /status = 'pending_review'/);
    assert.match(source, /status_version = \$\{expectedVersion\}/);
    assert.match(source, /payment\.amountPaid|request\.amountPaid/);
    assert.match(source, /payment\.approved/);
  });

  it("prevents multiple active subscriptions at the database boundary", () => {
    const schema = read("db/schema.ts");
    const migration = read("db/neon-migrations/0014_payment_integrity.sql");
    assert.match(schema, /user_subscriptions_one_active_idx/);
    assert.match(schema, /status} = 'active'/);
    assert.match(migration, /CREATE UNIQUE INDEX IF NOT EXISTS user_subscriptions_one_active_idx/);
    assert.match(migration, /WHERE status = 'active'/);
  });

  it("supports resuming the same payment request from dashboard and status", () => {
    const home = read("app/page.tsx");
    const checkout = read("app/checkout/checkout-client.tsx");
    const status = read("app/checkout/[id]/status/status-client.tsx");
    assert.match(home, /latestPaymentId/);
    assert.match(home, /paymentId=/);
    assert.match(checkout, /initialPaymentId/);
    assert.match(checkout, /let activePaymentId = paymentId/);
    const checkoutPage = read("app/checkout/page.tsx");
    assert.match(checkoutPage, /!planRow\.active && !existingPayment/);
    assert.match(checkoutPage, /existingPayment\?\.priceEgpSnapshot/);
    assert.match(status, /paymentId=\$\{encodeURIComponent\(payment\.id\)\}/);
  });

  it("keeps customer-action payment states and reviewer feedback actionable", () => {
    const home = read("app/page.tsx");
    const status = read("app/checkout/[id]/status/status-client.tsx");
    assert.match(status, /"cancelled"/);
    assert.match(status, /payment\.rejectionReason \|\| payment\.infoRequestReason/);
    assert.match(status, /plan=\$\{encodeURIComponent\(payment\.planCode\)\}/);
    assert.match(home, /const needsCustomerAction = \["draft", "needs_info"\]/);
    assert.match(home, /const awaitingReview = subscription\.latestPaymentStatus === "pending_review"/);
  });

  it("models configurable, authenticated payment destinations", () => {
    const schema = read("db/schema.ts");
    const migration = read("db/neon-migrations/0015_payment_destinations.sql");
    const checkout = read("app/checkout/checkout-client.tsx");
    const admin = read("app/admin-payments.tsx");
    const destinationRoute = read("app/api/payment-destinations/route.ts");
    const adminDestinationRoute = read("app/api/admin/payment-destinations/route.ts");
    assert.match(schema, /paymentDestinations = pgTable\("payment_destinations"/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.payment_destinations/);
    assert.match(migration, /orange_cash/);
    assert.match(destinationRoute, /getPlatformIdentity/);
    assert.match(destinationRoute, /listActivePaymentDestinations/);
    assert.match(adminDestinationRoute, /forbiddenUnless\("users\.manage"\)/);
    assert.match(checkout, /destinations/);
    assert.match(checkout, /Copy transfer details/);
    assert.match(admin, /Payment receiving details/);
  });

  it("does not gate public platform content on the admin owner secret", () => {
    const source = read("lib/admin-data.ts");
    const publicConfig = source.slice(source.indexOf("export async function getPublicPlatformConfig"));
    assert.match(source, /async function ensurePublicPlatformData/);
    assert.match(publicConfig, /ensurePublicPlatformData\(\)/);
    assert.doesNotMatch(publicConfig, /ensurePlatformData\(\)/);
  });
});

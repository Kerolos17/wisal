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
    assert.ok(source.indexOf("getOwnPaymentSubmission(identity, id)") < source.indexOf("storeReceipt("));
    assert.match(source, /amount !== payment\.priceEgpSnapshot/);
    assert.match(source, /storeReceipt\(payment\.userId, id/);
    assert.match(source, /submitStoredReceipt/);
    assert.match(source, /discard: deleteReceipt/);
    assert.match(source, /guardSharedRateLimit\(`payment-receipt:\$\{payment\.userId\}`/);
    assert.ok(source.indexOf("getOwnPaymentSubmission(identity, id)") < source.indexOf("request.formData()"));
  });

  it("uses a transaction and status guards for approval", () => {
    const source = read("lib/payments.ts");
    assert.match(source, /onConflictDoNothing\(\{ target: paymentRequests\.idempotencyKey \}\)/);
    assert.match(source, /sqlClient\.transaction\(\[/);
    assert.match(source, /status = 'pending_review'/);
    assert.match(source, /status_version = \$\{expectedVersion\}/);
    assert.match(source, /payment\.amountPaid|request\.amountPaid/);
    assert.match(source, /payment\.approved/);
    assert.match(source, /\$\{startsAt\}::timestamptz \+ \(claimed\.duration_days_snapshot \* interval '1 day'\)/);
  });

  it("prevents multiple active subscriptions at the database boundary", () => {
    const schema = read("db/schema.ts");
    const migration = read("db/neon-migrations/0014_payment_integrity.sql");
    assert.match(schema, /user_subscriptions_one_active_idx/);
    assert.match(schema, /status} = 'active'/);
    assert.match(migration, /CREATE UNIQUE INDEX IF NOT EXISTS user_subscriptions_one_active_idx/);
    assert.match(migration, /WHERE status = 'active'/);
  });

  it("prevents caches from retaining private payment status and receipts", () => {
    const statusRoute = read("app/api/payments/[id]/route.ts");
    const receiptRoute = read("app/api/payments/[id]/receipt/route.ts");
    const adminReceiptRoute = read("app/api/admin/payments/[id]/receipt/route.ts");
    for (const source of [statusRoute, receiptRoute, adminReceiptRoute]) {
      assert.match(source, /Cache-Control": "private, no-store"/);
    }
  });

  it("uses the sold payment snapshot for active guest entitlement", () => {
    const source = read("lib/payments.ts");
    const resolver = source.slice(source.indexOf("export async function getGuestLimitForUser"), source.indexOf("export async function getGuestLimitForOwnerEmail"));
    assert.match(resolver, /sub\?\.paymentRequestId/);
    assert.match(resolver, /paymentRequests\.guestLimitSnapshot/);
    assert.ok(resolver.indexOf("paymentRequests.guestLimitSnapshot") < resolver.indexOf("platformPlans.guestLimit"));
  });

  it("presents paid plans consistently as time-bound subscriptions", () => {
    const home = read("app/page.tsx");
    const checkout = read("app/checkout/checkout-client.tsx");
    const status = read("app/checkout/[id]/status/status-client.tsx");
    const payments = read("lib/payments.ts");
    assert.doesNotMatch(home, /EGP per event|جنيه للمناسبة/);
    assert.match(home, /durationDays/);
    assert.match(checkout, /days from approval/);
    assert.match(checkout, /policyAccepted/);
    assert.match(checkout, /mandatory consumer rights remain unaffected/);
    assert.match(checkout, /not a tax invoice or fiscal receipt/);
    assert.match(checkout, /workspace\?section=support/);
    assert.match(status, /durationDaysSnapshot/);
    assert.match(status, /Active until/);
    assert.match(status, /Need help\? Open a support ticket/);
    assert.match(payments, /reviewedAt: row\.reviewedAt/);
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
    assert.match(status, /const checkoutHref = canResume \?/);
    assert.match(status, /Updates automatically/);
  });

  it("routes reviewed payments to their status page instead of restarting checkout", () => {
    const home = read("app/page.tsx");
    assert.match(home, /const statusHref = subscription\.latestPaymentId/);
    assert.match(home, /\/checkout\/\$\{encodeURIComponent\(subscription\.latestPaymentId\)\}\/status/);
    assert.match(home, /awaitingReview && statusHref/);
    assert.match(home, /requiresAction && checkoutHref/);
  });

  it("only exposes reviewer actions for requests waiting on review", () => {
    const admin = read("app/admin-payments.tsx");
    const payments = read("lib/payments.ts");
    assert.match(admin, /const canReview = payment\.status === "pending_review"/);
    assert.match(admin, /aria-required="true"/);
    assert.match(admin, /try \{/);
    assert.match(admin, /finally \{\s+setBusyId\(""\);/);
    assert.match(payments, /request\.status !== "pending_review"/);
    assert.match(payments, /message === "Payment request is not pending review"\) return 409/);
  });

  it("keeps payment administration aligned with full-admin permissions", () => {
    const adminPage = read("app/admin/page.tsx");
    const home = read("app/page.tsx");
    const dashboard = read("app/admin-dashboard.tsx");
    assert.match(adminPage, /canManagePayments=\{account\.role === "admin"\}/);
    assert.match(home, /canManagePayments\?: boolean/);
    assert.match(home, /canManagePayments=\{canManagePayments\}/);
    assert.match(dashboard, /canManagePayments = false/);
    assert.match(dashboard, /id !== "payments" \|\| canManagePayments/);
  });

  it("models configurable, authenticated payment destinations", () => {
    const schema = read("db/schema.ts");
    const migration = read("db/neon-migrations/0015_payment_destinations.sql");
    const checkout = read("app/checkout/checkout-client.tsx");
    const admin = read("app/admin-payments.tsx");
    const destinationRoute = read("app/api/payment-destinations/route.ts");
    const adminDestinationRoute = read("app/api/admin/payment-destinations/route.ts");
    const qrRoute = read("app/api/payment-destinations/[method]/qr/route.ts");
    assert.match(schema, /paymentDestinations = pgTable\("payment_destinations"/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.payment_destinations/);
    assert.match(migration, /orange_cash/);
    assert.match(destinationRoute, /getPlatformIdentity/);
    assert.match(destinationRoute, /listActivePaymentDestinations/);
    assert.match(adminDestinationRoute, /forbiddenUnless\("payments\.review"\)/);
    assert.match(checkout, /destinations/);
    assert.match(checkout, /Copy transfer details/);
    assert.match(checkout, /paymentUrl/);
    assert.match(checkout, /aria-haspopup="dialog"/);
    assert.match(checkout, /onKeyDown=\{trapQrFocus\}/);
    assert.match(checkout, /payment-destinations\/\$\{destination\.method\}\/qr/);
    assert.match(schema, /paymentUrl: text\("payment_url"\)/);
    assert.match(schema, /qrKey: text\("qr_key"\)/);
    assert.match(qrRoute, /getPlatformIdentity/);
    assert.match(qrRoute, /Cache-Control.*private, no-store/);
    assert.match(destinationRoute, /Cache-Control.*private, no-store/);
    assert.match(admin, /Payment receiving details/);
  });

  it("keeps public platform content read-only and independent from the admin owner secret", () => {
    const source = read("lib/admin-data.ts");
    const publicConfig = source.slice(source.indexOf("export async function getPublicPlatformConfig"));
    assert.doesNotMatch(source, /async function ensurePublicPlatformData/);
    assert.doesNotMatch(publicConfig, /\.insert\(|\.update\(|\.delete\(/);
    assert.doesNotMatch(publicConfig, /ensurePlatformData\(\)/);
  });

  it("writes cancel, reject, request-info, and their audit records atomically", () => {
    const source = read("lib/payments.ts");
    for (const action of ["payment.cancelled", "payment.rejected", "payment.info_requested"]) {
      const actionIndex = source.indexOf(`'${action}'`);
      assert.ok(actionIndex > 0, action);
      const transactionIndex = source.lastIndexOf("sqlClient.transaction([", actionIndex);
      const claimedIndex = source.lastIndexOf("WITH claimed AS", actionIndex);
      assert.ok(transactionIndex >= 0 && claimedIndex > transactionIndex, `${action} transaction`);
    }
  });

  it("uses a dedicated payment-review permission instead of user management", () => {
    const permissions = read("lib/admin-auth.ts");
    const paymentsRoute = read("app/api/admin/payments/route.ts");
    assert.match(permissions, /"payments\.review"/);
    assert.match(paymentsRoute, /forbiddenUnless\("payments\.review"\)/);
    assert.doesNotMatch(paymentsRoute, /forbiddenUnless\("users\.manage"\)/);
  });

  it("audits privileged receipt reads without retaining receipt identifiers", () => {
    const payments = read("lib/payments.ts");
    const receiptRoute = read("app/api/admin/payments/[id]/receipt/route.ts");
    assert.match(payments, /payment\.receipt_viewed/);
    assert.match(receiptRoute, /await auditPaymentReceiptRead\(identity, id\)/);
  });
});

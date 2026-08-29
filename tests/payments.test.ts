import { describe, it, before, after } from "node:test";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { configurePaymentTestEnvironment } from "./helpers/payment-test-environment.mjs";
import { ensurePaymentTestPlans } from "./helpers/payment-test-data";

configurePaymentTestEnvironment();

import {
  approvePaymentRequest,
  cancelPaymentRequest,
  createPaymentRequest,
  getActiveSubscription,
  getOwnPaymentRequest,
  getOwnPaymentSubmission,
  listPaymentRequests,
  rejectPaymentRequest,
  requestInfoPaymentRequest,
  submitPaymentRequest,
} from "@/lib/payments";
import { getDb } from "@/db";
import { paymentRequests, platformPlans, userSubscriptions, users } from "@/db/schema";
import { eq } from "drizzle-orm";

const runId = randomUUID();
const createdUserIds: string[] = [];
const createdPaymentIds: string[] = [];
let adminEmail = "";
let paidPlan: { code: string; priceEgp: number; durationDays: number };

function fakeIdentity(email: string) {
  return { displayName: email.split("@")[0], email, fullName: null };
}

async function createTestUser(label: string) {
  const email = `payment-test-${label}-${runId}-${randomUUID().slice(0, 8)}@example.test`;
  const [user] = await getDb().insert(users).values({ email, displayName: label, role: "couple" }).returning({ id: users.id });
  if (!user) throw new Error("Failed to create test user");
  createdUserIds.push(user.id);
  return { ...user, email };
}

async function createDraft(email: string) {
  const draft = await createPaymentRequest(fakeIdentity(email), { planCode: paidPlan.code, idempotencyKey: randomUUID() });
  createdPaymentIds.push(draft.id);
  return draft;
}

async function submitDraft(email: string, draft: Awaited<ReturnType<typeof createPaymentRequest>>, suffix = "receipt") {
  return submitPaymentRequest(
    fakeIdentity(email),
    draft.id,
    { key: `receipts/${draft.userId}/${draft.id}/${suffix}.pdf`, mime: "application/pdf", size: 1024, checksum: randomUUID() },
    { paymentMethod: "instapay", amountPaid: paidPlan.priceEgp },
  );
}

describe("payment domain", () => {
  before(async () => {
    await ensurePaymentTestPlans();
    const plans = await getDb().select().from(platformPlans);
    const plan = plans.find((item) => item.active && item.priceEgp > 0 && item.durationDays > 0);
    if (!plan) throw new Error("Payment tests require one active paid plan with a duration");
    paidPlan = { code: plan.code, priceEgp: plan.priceEgp, durationDays: plan.durationDays };

    adminEmail = `payment-test-admin-${runId}@example.test`;
    const [admin] = await getDb().insert(users).values({ email: adminEmail, displayName: "Payment Test Admin", role: "admin" }).returning({ id: users.id });
    if (!admin) throw new Error("Failed to create payment test admin");
    createdUserIds.push(admin.id);
  });

  after(async () => {
    const db = getDb();
    for (const id of createdPaymentIds) await db.delete(paymentRequests).where(eq(paymentRequests.id, id)).catch(() => {});
    for (const id of createdUserIds) await db.delete(users).where(eq(users.id, id)).catch(() => {});
  });

  it("rejects creation with an unknown plan", async () => {
    const user = await createTestUser("Unknown plan");
    await assert.rejects(
      () => createPaymentRequest(fakeIdentity(user.email), { planCode: "nonexistent", idempotencyKey: randomUUID() }),
      /Plan not found/,
    );
  });

  it("activates the selected paid plan for exactly its snapshotted duration", async () => {
    const user = await createTestUser("Approval");
    const draft = await createDraft(user.email);
    assert.equal(draft.priceEgpSnapshot, paidPlan.priceEgp);
    assert.equal(draft.durationDaysSnapshot, paidPlan.durationDays);

    const submitted = await submitDraft(user.email, draft);
    const approved = await approvePaymentRequest(fakeIdentity(adminEmail) as never, draft.id, submitted.statusVersion);
    assert.equal(approved.status, "approved");
    assert.ok(approved.reviewedAt);

    const subscription = await getActiveSubscription(draft.userId);
    assert.equal(subscription?.planCode, paidPlan.code);
    assert.equal(
      new Date(subscription!.expiresAt).getTime() - new Date(subscription!.startsAt).getTime(),
      paidPlan.durationDays * 24 * 60 * 60 * 1000,
    );
  });

  it("makes reviewer feedback actionable through resubmission and rejection", async () => {
    const user = await createTestUser("Feedback");
    const draft = await createDraft(user.email);
    const submitted = await submitDraft(user.email, draft, "first");
    const needsInfo = await requestInfoPaymentRequest(fakeIdentity(adminEmail) as never, draft.id, submitted.statusVersion, "Reference number required");
    assert.equal(needsInfo.status, "needs_info");

    const resumed = await submitDraft(user.email, draft, "second");
    assert.equal(resumed.status, "pending_review");
    const rejected = await rejectPaymentRequest(fakeIdentity(adminEmail) as never, draft.id, resumed.statusVersion, "Receipt amount does not match");
    assert.equal(rejected.rejectionReason, "Receipt amount does not match");
  });

  it("isolates payment requests and blocks submissions after cancellation", async () => {
    const owner = await createTestUser("Owner");
    const otherUser = await createTestUser("Other");
    const draft = await createDraft(owner.email);
    const cancelled = await cancelPaymentRequest(fakeIdentity(owner.email), draft.id);
    assert.equal(cancelled.status, "cancelled");
    assert.equal(await getOwnPaymentRequest(fakeIdentity(otherUser.email), draft.id), null);
    await assert.rejects(() => submitDraft(owner.email, draft), /submittable state/);
  });

  it("hides a submitted payment and its receipt metadata from another account", async () => {
    const owner = await createTestUser("Submitted owner");
    const otherUser = await createTestUser("Submitted outsider");
    const draft = await createDraft(owner.email);
    const submitted = await submitDraft(owner.email, draft, "private-receipt");

    assert.equal((await getOwnPaymentRequest(fakeIdentity(owner.email), submitted.id))?.hasReceipt, true);
    assert.equal(await getOwnPaymentRequest(fakeIdentity(otherUser.email), submitted.id), null);
    assert.equal(await getOwnPaymentSubmission(fakeIdentity(otherUser.email), submitted.id), null);
  });

  it("expires a subscription at read time and removes its entitlement", async () => {
    const user = await createTestUser("Expired subscription");
    const startsAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const expiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [subscription] = await getDb().insert(userSubscriptions).values({
      userId: user.id,
      planCode: paidPlan.code,
      status: "active",
      startsAt,
      expiresAt,
    }).returning({ id: userSubscriptions.id });

    assert.ok(subscription);
    assert.equal(await getActiveSubscription(user.id), null);
    const [expired] = await getDb().select({ status: userSubscriptions.status })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.id, subscription.id))
      .limit(1);
    assert.equal(expired?.status, "expired");
  });

  it("prevents a second request from entering review for the same user", async () => {
    const user = await createTestUser("Pending limit");
    const first = await createDraft(user.email);
    await submitDraft(user.email, first, "first");
    const second = await createDraft(user.email);
    await assert.rejects(() => submitDraft(user.email, second, "second"), /already under review/);
  });

  it("lets an admin list payment requests", async () => {
    const payments = await listPaymentRequests(fakeIdentity(adminEmail) as never);
    assert.ok(Array.isArray(payments));
  });

  it("allows exactly one concurrent approval", async () => {
    const user = await createTestUser("Concurrency");
    const draft = await createDraft(user.email);
    const submitted = await submitDraft(user.email, draft);
    const results = await Promise.allSettled([
      approvePaymentRequest(fakeIdentity(adminEmail) as never, draft.id, submitted.statusVersion),
      approvePaymentRequest(fakeIdentity(adminEmail) as never, draft.id, submitted.statusVersion),
    ]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected").length, 1);
  });
});

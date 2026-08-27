import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createPaymentRequest, submitPaymentRequest, approvePaymentRequest, listPaymentRequests } from "@/lib/payments";
import { getDb } from "@/db";
import { users, paymentRequests } from "@/db/schema";
import { eq } from "drizzle-orm";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required for payment tests");

function fakeIdentity(email: string) {
  return { displayName: email.split("@")[0], email, fullName: null };
}

describe("payment domain", () => {
  let testUserEmail = "";
  const testUserIds: string[] = [];
  const createdPaymentIds: string[] = [];

  before(async () => {
    const email = `paytest-${Date.now()}@example.com`;
    await getDb().insert(users).values({ email, displayName: "Pay Test", role: "couple" }).onConflictDoNothing();
    const [row] = await getDb().select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (!row) throw new Error("Failed to create test user");
    testUserEmail = email;
    testUserIds.push(row.id);

    // Ensure an admin exists for review actions
    await getDb().insert(users).values({ email: "owner@example.com", displayName: "Admin", role: "admin" }).onConflictDoNothing();
    const [admin] = await getDb().select({ id: users.id }).from(users).where(eq(users.email, "owner@example.com")).limit(1);
    if (admin) testUserIds.push(admin.id);
  });

  after(async () => {
    const db = getDb();
    for (const id of createdPaymentIds) {
      await db.delete(paymentRequests).where(eq(paymentRequests.id, id)).catch(() => {});
    }
    for (const id of testUserIds) {
      await db.delete(users).where(eq(users.id, id)).catch(() => {});
    }
  });

  it("rejects creation without a plan", async () => {
    const identity = fakeIdentity(testUserEmail);
    await assert.rejects(
      () => createPaymentRequest(identity, { planCode: "nonexistent", idempotencyKey: crypto.randomUUID() }),
      /Plan not found/,
    );
  });

  it("creates a draft, submits, and approves (happy path)", async () => {
    const identity = fakeIdentity(testUserEmail);
    const draft = await createPaymentRequest(identity, { planCode: "starter", idempotencyKey: crypto.randomUUID() });
    assert.equal(draft.status, "draft");
    createdPaymentIds.push(draft.id);

    const submitted = await submitPaymentRequest(
      identity,
      draft.id,
      { key: `receipts/${draft.userId}/${draft.id}.pdf`, mime: "application/pdf", size: 1024, checksum: "abc" },
      { paymentMethod: "instapay", amountPaid: 0 },
    );
    assert.equal(submitted.status, "pending_review");

    const adminIdentity = { displayName: "Admin", email: "owner@example.com", fullName: null };
    const approved = await approvePaymentRequest(adminIdentity as never, draft.id, submitted.statusVersion);
    assert.equal(approved.status, "approved");
  });

  it("prevents a second pending_review per user", async () => {
    const identity = fakeIdentity(testUserEmail);
    const first = await createPaymentRequest(identity, { planCode: "starter", idempotencyKey: crypto.randomUUID() });
    createdPaymentIds.push(first.id);
    await submitPaymentRequest(
      identity,
      first.id,
      { key: `receipts/${first.userId}/${first.id}.pdf`, mime: "application/pdf", size: 1024, checksum: "x" },
      { paymentMethod: "instapay", amountPaid: 0 },
    );

    const second = await createPaymentRequest(identity, { planCode: "starter", idempotencyKey: crypto.randomUUID() });
    createdPaymentIds.push(second.id);
    await assert.rejects(
      () => submitPaymentRequest(
        identity,
        second.id,
        { key: `receipts/${second.userId}/${second.id}.pdf`, mime: "application/pdf", size: 1024, checksum: "y" },
        { paymentMethod: "instapay", amountPaid: 0 },
      ),
      /already under review/,
    );
  });

  it("admin can list payments", async () => {
    const adminIdentity = { displayName: "Admin", email: "owner@example.com", fullName: null };
    const list = await listPaymentRequests(adminIdentity as never);
    assert.ok(Array.isArray(list));
  });

  it("guards concurrent approval via the statusVersion claim", async () => {
    // Use a dedicated user so an existing pending_review from another test
    // does not block this draft's submission.
    const email = `paytest-conc-${Date.now()}@example.com`;
    await getDb().insert(users).values({ email, displayName: "Conc", role: "couple" }).onConflictDoNothing();
    const [u] = await getDb().select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (u) testUserIds.push(u.id);
    const identity = fakeIdentity(email);
    const draft = await createPaymentRequest(identity, { planCode: "starter", idempotencyKey: crypto.randomUUID() });
    createdPaymentIds.push(draft.id);
    const submitted = await submitPaymentRequest(
      identity,
      draft.id,
      { key: `receipts/${draft.userId}/${draft.id}.pdf`, mime: "application/pdf", size: 1024, checksum: "c" },
      { paymentMethod: "instapay", amountPaid: 0 },
    );
    const adminIdentity = { displayName: "Admin", email: "owner@example.com", fullName: null };
    const results = await Promise.allSettled([
      approvePaymentRequest(adminIdentity as never, draft.id, submitted.statusVersion),
      approvePaymentRequest(adminIdentity as never, draft.id, submitted.statusVersion),
    ]);
    let successCount = 0;
    let rejectionCount = 0;
    for (const r of results) {
      if (r.status === "fulfilled") successCount++;
      else rejectionCount++;
    }
    assert.equal(successCount, 1, "exactly one concurrent approval should succeed");
    assert.equal(rejectionCount, 1, "the losing concurrent approval must be rejected");
  });
});

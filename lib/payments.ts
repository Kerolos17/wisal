import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { paymentAuditLogs, paymentRequests, platformPlans, userSubscriptions, users } from "@/db/schema";
import type { PlatformIdentity } from "@/lib/auth/identity";

const nowIso = () => new Date().toISOString();

// --- Permissions helpers ---

async function requireUser(identity: PlatformIdentity) {
  const db = getDb();
  const [user] = await db.select({ id: users.id, email: users.email, role: users.role, displayName: users.displayName })
    .from(users)
    .where(eq(users.email, identity.email))
    .limit(1);
  if (!user) throw new Error("User account not found");
  return user;
}

function isAdmin(role: string | undefined) {
  return role === "admin";
}

/**
 * Maps a thrown payment error to the correct HTTP status so callers receive
 * 403/404/409/400 semantics instead of a blanket 500.
 */
export function paymentErrorStatus(error: unknown): number {
  const code = (error as { code?: string } | null)?.code;
  if (code === "CONFLICT") return 409;
  if (code === "FORBIDDEN") return 403;
  const message = error instanceof Error ? error.message : "";
  if (message === "Forbidden" || message === "Referenced plan is unavailable" || message === "Plan price has changed since request") return 403;
  if (
    message === "Plan not found" ||
    message === "Plan is not available" ||
    message === "Plan duration is not configured" ||
    message === "Payment request is not in a submittable state" ||
    message === "Payment request cannot be cancelled" ||
    message === "User account not found"
  ) return 400;
  if (message.endsWith("not found")) return 404;
  return 500;
}

// --- Audit ---

async function audit(actorUserId: string | null, action: string, paymentRequestId: string | null, userId: string | null, metadata: Record<string, unknown> = {}) {
  if (metadata && typeof metadata === "object") {
    for (const key of Object.keys(metadata)) {
      const value = (metadata as Record<string, unknown>)[key];
      if (typeof value === "string" && (key.toLowerCase().includes("receipt") || key.toLowerCase().includes("key"))) {
        (metadata as Record<string, unknown>)[key] = "[redacted]";
      }
    }
  }
  await getDb().insert(paymentAuditLogs).values({
    actorUserId: actorUserId,
    action,
    paymentRequestId,
    userId,
    metadata,
  });
}

// --- Customer: create draft ---

export async function createPaymentRequest(identity: PlatformIdentity, input: { planCode: string; idempotencyKey: string }) {
  const db = getDb();
  const user = await requireUser(identity);

  const [plan] = await db.select().from(platformPlans).where(eq(platformPlans.code, input.planCode)).limit(1);
  if (!plan) throw new Error("Plan not found");
  if (!plan.active) throw new Error("Plan is not available");
  if (!plan.durationDays) throw new Error("Plan duration is not configured");

  // Prevent duplicate idempotency key
  const [existingKey] = await db.select({ id: paymentRequests.id }).from(paymentRequests).where(eq(paymentRequests.idempotencyKey, input.idempotencyKey)).limit(1);
  if (existingKey) {
    throw Object.assign(new Error("A payment request with this idempotency key already exists"), { code: "CONFLICT" });
  }

  const [created] = await db.insert(paymentRequests).values({
    userId: user.id,
    planCode: plan.code,
    planNameSnapshot: plan.nameAr,
    priceEgpSnapshot: plan.priceEgp,
    guestLimitSnapshot: plan.guestLimit,
    durationDaysSnapshot: plan.durationDays,
    idempotencyKey: input.idempotencyKey,
  }).returning();

  await audit(user.id, "payment.created", created.id, user.id, { planCode: plan.code });
  return serializePayment(created);
}

// --- Customer: submit receipt (draft -> pending_review) ---

export async function submitPaymentRequest(
  identity: PlatformIdentity,
  id: string,
  receipt: { key: string; mime: string; size: number; checksum: string },
  details: { paymentMethod: string; amountPaid: number; referenceNumber?: string; payerName?: string; payerPhoneMasked?: string },
) {
  const db = getDb();
  const user = await requireUser(identity);

  const [request] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, id)).limit(1);
  if (!request) throw new Error("Payment request not found");
  if (request.userId !== user.id) throw new Error("Forbidden");
  if (request.status !== "draft" && request.status !== "needs_info") throw new Error("Payment request is not in a submittable state");

  // Only one pending_review per user (partial unique index also enforces this)
  const [pending] = await db.select({ id: paymentRequests.id }).from(paymentRequests)
    .where(and(eq(paymentRequests.userId, user.id), eq(paymentRequests.status, "pending_review")))
    .limit(1);
  if (pending) throw Object.assign(new Error("A payment request is already under review"), { code: "CONFLICT" });

  const [updated] = await db.update(paymentRequests)
    .set({
      status: "pending_review",
      submittedAt: nowIso(),
      receiptKey: receipt.key,
      receiptMime: receipt.mime,
      receiptSize: receipt.size,
      receiptChecksum: receipt.checksum,
      paymentMethod: details.paymentMethod as typeof paymentRequests.$inferInsert.paymentMethod,
      amountPaid: details.amountPaid,
      referenceNumber: details.referenceNumber,
      payerName: details.payerName,
      payerPhoneMasked: details.payerPhoneMasked,
      statusVersion: sql`${paymentRequests.statusVersion} + 1`,
      updatedAt: nowIso(),
    })
    .where(and(eq(paymentRequests.id, id), eq(paymentRequests.status, "draft")))
    .returning();

  if (!updated) throw new Error("Payment request is not in a submittable state");
  await audit(user.id, "payment.submitted", updated.id, user.id, { planCode: updated.planCode });
  return serializePayment(updated);
}

// --- Customer: cancel (draft | pending_review | needs_info -> cancelled) ---

export async function cancelPaymentRequest(identity: PlatformIdentity, id: string) {
  const db = getDb();
  const user = await requireUser(identity);

  const [request] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, id)).limit(1);
  if (!request) throw new Error("Payment request not found");
  if (request.userId !== user.id) throw new Error("Forbidden");
  if (request.status === "approved" || request.status === "rejected" || request.status === "cancelled") {
    throw new Error("Payment request cannot be cancelled");
  }

  const [updated] = await db.update(paymentRequests)
    .set({ status: "cancelled", statusVersion: sql`${paymentRequests.statusVersion} + 1`, updatedAt: nowIso() })
    .where(eq(paymentRequests.id, id))
    .returning();
  await audit(user.id, "payment.cancelled", updated.id, user.id);
  return serializePayment(updated);
}

// --- Customer: get own ---

export async function getOwnPaymentRequest(identity: PlatformIdentity, id: string) {
  const db = getDb();
  const user = await requireUser(identity);
  const [request] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, id)).limit(1);
  if (!request || request.userId !== user.id) return null;
  return serializePayment(request);
}

// --- Admin: list all ---

export async function listPaymentRequests(identity: PlatformIdentity) {
  const db = getDb();
  const user = await requireUser(identity);
  if (!isAdmin(user.role)) throw new Error("Forbidden");

  const rows = await db.select().from(paymentRequests).orderBy(desc(paymentRequests.createdAt)).limit(200);
  return rows.map(serializePayment);
}

// --- Admin: approve (pending_review -> approved, atomic subscription activation) ---

export async function approvePaymentRequest(identity: PlatformIdentity, id: string, expectedVersion: number) {
  const db = getDb();
  const admin = await requireUser(identity);
  if (!isAdmin(admin.role)) throw new Error("Forbidden");

  // Note: neon-http / neon WebSocket drivers do not support transactions, so we
  // cannot wrap the paymentRequest transition and the subscription mutation in one
  // transaction. Instead we atomically "claim" the pending_review -> approved
  // transition using a statusVersion-guarded UPDATE. Only the winning admin
  // proceeds to mutate the subscription, which prevents double-activation.
  const [request] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, id)).limit(1);
  if (!request) throw new Error("Payment request not found");
  if (request.status !== "pending_review") throw new Error("Payment request is not pending review");
  if (request.statusVersion !== expectedVersion) throw Object.assign(new Error("Another admin reviewed this request"), { code: "CONFLICT" });

  const [plan] = await db.select().from(platformPlans).where(eq(platformPlans.code, request.planCode)).limit(1);
  if (!plan || !plan.active) throw new Error("Referenced plan is unavailable");
  if (plan.priceEgp !== request.priceEgpSnapshot) throw new Error("Plan price has changed since request");

  const startsAt = nowIso();

  const [claimed] = await db.update(paymentRequests)
    .set({ status: "approved", reviewedBy: admin.id, reviewedAt: startsAt, statusVersion: sql`${paymentRequests.statusVersion} + 1`, updatedAt: startsAt })
    .where(and(eq(paymentRequests.id, id), eq(paymentRequests.status, "pending_review"), eq(paymentRequests.statusVersion, expectedVersion)))
    .returning();
  if (!claimed) throw Object.assign(new Error("Another admin reviewed this request"), { code: "CONFLICT" });

  const expiresAtIso = new Date(Date.now() + (request.durationDaysSnapshot || 365) * 24 * 60 * 60 * 1000).toISOString();
  const [active] = await db.select().from(userSubscriptions)
    .where(and(eq(userSubscriptions.userId, request.userId), eq(userSubscriptions.status, "active")))
    .limit(1);

  if (!active) {
    await db.insert(userSubscriptions).values({
      userId: request.userId,
      planCode: request.planCode,
      status: "active",
      startsAt,
      expiresAt: expiresAtIso,
      paymentRequestId: request.id,
    });
  } else if (active.planCode === request.planCode) {
    const currentExpiry = new Date(active.expiresAt).getTime();
    const baseExpiry = Math.max(Date.now(), currentExpiry);
    const newExpiry = new Date(baseExpiry + request.durationDaysSnapshot * 24 * 60 * 60 * 1000).toISOString();
    await db.update(userSubscriptions).set({ expiresAt: newExpiry, updatedAt: startsAt, paymentRequestId: request.id })
      .where(eq(userSubscriptions.id, active.id));
  } else {
    await db.update(userSubscriptions).set({ status: "cancelled", updatedAt: startsAt }).where(eq(userSubscriptions.id, active.id));
    await db.insert(userSubscriptions).values({
      userId: request.userId,
      planCode: request.planCode,
      status: "active",
      startsAt,
      expiresAt: expiresAtIso,
      paymentRequestId: request.id,
    });
  }

  await db.insert(paymentAuditLogs).values({
    actorUserId: admin.id,
    action: "payment.approved",
    paymentRequestId: request.id,
    userId: request.userId,
    metadata: { planCode: request.planCode },
  });

  return serializePayment(claimed);
}

// --- Admin: reject ---

export async function rejectPaymentRequest(identity: PlatformIdentity, id: string, expectedVersion: number, reason: string) {
  const db = getDb();
  const admin = await requireUser(identity);
  if (!isAdmin(admin.role)) throw new Error("Forbidden");

  const [request] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, id)).limit(1);
  if (!request) throw new Error("Payment request not found");
  if (request.status !== "pending_review") throw new Error("Payment request is not pending review");
  if (request.statusVersion !== expectedVersion) throw Object.assign(new Error("Another admin reviewed this request"), { code: "CONFLICT" });

  const [updated] = await db.update(paymentRequests)
    .set({ status: "rejected", rejectionReason: reason, reviewedBy: admin.id, reviewedAt: nowIso(), statusVersion: sql`${paymentRequests.statusVersion} + 1`, updatedAt: nowIso() })
    .where(and(eq(paymentRequests.id, id), eq(paymentRequests.statusVersion, expectedVersion)))
    .returning();
  if (!updated) throw Object.assign(new Error("Another admin reviewed this request"), { code: "CONFLICT" });
  await audit(admin.id, "payment.rejected", updated.id, request.userId, { reason });
  return serializePayment(updated);
}

// --- Admin: request info ---

export async function requestInfoPaymentRequest(identity: PlatformIdentity, id: string, expectedVersion: number, reason: string) {
  const db = getDb();
  const admin = await requireUser(identity);
  if (!isAdmin(admin.role)) throw new Error("Forbidden");

  const [request] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, id)).limit(1);
  if (!request) throw new Error("Payment request not found");
  if (request.status !== "pending_review") throw new Error("Payment request is not pending review");
  if (request.statusVersion !== expectedVersion) throw Object.assign(new Error("Another admin reviewed this request"), { code: "CONFLICT" });

  const [updated] = await db.update(paymentRequests)
    .set({ status: "needs_info", infoRequestReason: reason, reviewedBy: admin.id, reviewedAt: nowIso(), statusVersion: sql`${paymentRequests.statusVersion} + 1`, updatedAt: nowIso() })
    .where(and(eq(paymentRequests.id, id), eq(paymentRequests.statusVersion, expectedVersion)))
    .returning();
  if (!updated) throw Object.assign(new Error("Another admin reviewed this request"), { code: "CONFLICT" });
  await audit(admin.id, "payment.info_requested", updated.id, request.userId, { reason });
  return serializePayment(updated);
}

// --- Subscription helpers ---

export async function getActiveSubscription(userId: string) {
  const db = getDb();
  const [sub] = await db.select().from(userSubscriptions)
    .where(and(eq(userSubscriptions.userId, userId), eq(userSubscriptions.status, "active")))
    .limit(1);
  if (!sub) return null;
  if (new Date(sub.expiresAt).getTime() < Date.now()) {
    await db.update(userSubscriptions).set({ status: "expired", updatedAt: nowIso() }).where(eq(userSubscriptions.id, sub.id));
    return null;
  }
  return sub;
}

/**
 * Resolves the guest limit (from platformPlans) for a user's active subscription.
 * Returns `null` for unlimited plans (e.g. signature).
 * When the user has no active subscription, defaults to the free "starter" plan.
 */
export async function getGuestLimitForUser(userId: string): Promise<number | null> {
  const sub = await getActiveSubscription(userId);
  const planCode = sub?.planCode ?? "starter";
  const [plan] = await getDb().select({ guestLimit: platformPlans.guestLimit })
    .from(platformPlans)
    .where(eq(platformPlans.code, planCode))
    .limit(1);
  // Floor to the free-plan limit when the plan row is missing, so a missing row
  // never silently grants unlimited guests to everyone.
  if (!plan) return 50;
  return plan.guestLimit ?? null;
}

/**
 * Convenience wrapper that resolves the guest limit from an owner email.
 * Returns `null` if the email does not map to a known user.
 */
export async function getGuestLimitForOwnerEmail(ownerEmail: string): Promise<number | null> {
  const db = getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, ownerEmail)).limit(1);
  if (!user) return null;
  return getGuestLimitForUser(user.id);
}

export type SerializedPayment = {
  id: string;
  userId: string;
  planCode: string;
  status: string;
  planNameSnapshot: string;
  priceEgpSnapshot: number;
  currency: string;
  guestLimitSnapshot: number | null;
  durationDaysSnapshot: number;
  paymentMethod: string | null;
  amountPaid: number | null;
  referenceNumber: string | null;
  payerName: string | null;
  payerPhoneMasked: string | null;
  hasReceipt: boolean;
  reviewedBy: string | null;
  rejectionReason: string | null;
  adminNotes: string | null;
  infoRequestReason: string | null;
  idempotencyKey: string;
  statusVersion: number;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function serializePayment(row: typeof paymentRequests.$inferSelect): SerializedPayment {
  return {
    id: row.id,
    userId: row.userId,
    planCode: row.planCode,
    status: row.status,
    planNameSnapshot: row.planNameSnapshot,
    priceEgpSnapshot: row.priceEgpSnapshot,
    currency: row.currency,
    guestLimitSnapshot: row.guestLimitSnapshot,
    durationDaysSnapshot: row.durationDaysSnapshot,
    paymentMethod: row.paymentMethod,
    amountPaid: row.amountPaid,
    referenceNumber: row.referenceNumber,
    payerName: row.payerName,
    payerPhoneMasked: row.payerPhoneMasked,
    hasReceipt: Boolean(row.receiptKey),
    reviewedBy: row.reviewedBy,
    rejectionReason: row.rejectionReason,
    adminNotes: row.adminNotes,
    infoRequestReason: row.infoRequestReason,
    idempotencyKey: row.idempotencyKey,
    statusVersion: row.statusVersion,
    submittedAt: row.submittedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

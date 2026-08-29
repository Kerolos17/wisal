import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, getSql } from "@/db";
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
  if (message === "Payment request is not in a submittable state") return 409;
  if (message === "Payment request is not pending review") return 409;
  if (
    message === "Plan not found" ||
    message === "Plan is not available" ||
    message === "Plan duration is not configured" ||
    message === "Payment request cannot be cancelled" ||
    message === "User account not found" ||
    message === "Payment amount is invalid" ||
    message === "Payment amount does not match plan price"
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
  const [existingKey] = await db.select().from(paymentRequests).where(eq(paymentRequests.idempotencyKey, input.idempotencyKey)).limit(1);
  if (existingKey) {
    if (existingKey.userId !== user.id || existingKey.planCode !== plan.code) {
      throw Object.assign(new Error("A payment request with this idempotency key already exists"), { code: "CONFLICT" });
    }
    return serializePayment(existingKey);
  }

  const [created] = await db.insert(paymentRequests).values({
    userId: user.id,
    planCode: plan.code,
    planNameSnapshot: plan.nameAr,
    priceEgpSnapshot: plan.priceEgp,
    guestLimitSnapshot: plan.guestLimit,
    durationDaysSnapshot: plan.durationDays,
    idempotencyKey: input.idempotencyKey,
  }).onConflictDoNothing({ target: paymentRequests.idempotencyKey }).returning();

  // A concurrent retry can win the unique-key race after the read above.
  // Resolve that race to the same request instead of returning a 500.
  if (!created) {
    const [raced] = await db.select().from(paymentRequests).where(eq(paymentRequests.idempotencyKey, input.idempotencyKey)).limit(1);
    if (raced && raced.userId === user.id && raced.planCode === plan.code) return serializePayment(raced);
    throw Object.assign(new Error("A payment request with this idempotency key already exists"), { code: "CONFLICT" });
  }

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

  if (!Number.isInteger(details.amountPaid) || details.amountPaid < 0) throw new Error("Payment amount is invalid");
  if (details.amountPaid !== request.priceEgpSnapshot) throw new Error("Payment amount does not match plan price");

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
      infoRequestReason: null,
      statusVersion: sql`${paymentRequests.statusVersion} + 1`,
      updatedAt: nowIso(),
    })
    .where(and(eq(paymentRequests.id, id), eq(paymentRequests.status, request.status), eq(paymentRequests.statusVersion, request.statusVersion)))
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

  const changedAt = nowIso();
  const sqlClient = getSql();
  const [auditRows] = await sqlClient.transaction([
    sqlClient`
      WITH claimed AS (
        UPDATE public.payment_requests AS pr
        SET status = 'cancelled', status_version = pr.status_version + 1, updated_at = ${changedAt}
        WHERE pr.id = ${id}
          AND pr.user_id = ${user.id}
          AND pr.status = ${request.status}
          AND pr.status_version = ${request.statusVersion}
        RETURNING pr.id, pr.user_id
      )
      INSERT INTO public.payment_audit_logs (actor_user_id, action, payment_request_id, user_id, metadata)
      SELECT ${user.id}, 'payment.cancelled', claimed.id, claimed.user_id, '{}'::jsonb
      FROM claimed
      RETURNING id
    `,
  ]);
  if (!Array.isArray(auditRows) || auditRows.length === 0) {
    throw Object.assign(new Error("Another process changed this payment request"), { code: "CONFLICT" });
  }
  return serializePayment({ ...request, status: "cancelled", statusVersion: request.statusVersion + 1, updatedAt: changedAt });
}

// --- Customer: get own ---

export async function getOwnPaymentRequest(identity: PlatformIdentity, id: string) {
  const db = getDb();
  const user = await requireUser(identity);
  const [request] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, id)).limit(1);
  if (!request || request.userId !== user.id) return null;
  return serializePayment(request);
}

/** Server-only view used while replacing a private receipt. */
export async function getOwnPaymentSubmission(identity: PlatformIdentity, id: string) {
  const db = getDb();
  const user = await requireUser(identity);
  const [request] = await db.select({
    id: paymentRequests.id,
    userId: paymentRequests.userId,
    status: paymentRequests.status,
    priceEgpSnapshot: paymentRequests.priceEgpSnapshot,
    receiptKey: paymentRequests.receiptKey,
  }).from(paymentRequests).where(eq(paymentRequests.id, id)).limit(1);
  if (!request || request.userId !== user.id) return null;
  return request;
}

// --- Admin: list all ---

export async function listPaymentRequests(identity: PlatformIdentity) {
  const db = getDb();
  const user = await requireUser(identity);
  if (!isAdmin(user.role)) throw new Error("Forbidden");

  const rows = await db.select().from(paymentRequests).orderBy(desc(paymentRequests.createdAt)).limit(200);
  return rows.map(serializePayment);
}

/** Records access to sensitive receipt material without storing its key or contents. */
export async function auditPaymentReceiptRead(identity: PlatformIdentity, paymentRequestId: string) {
  const db = getDb();
  const admin = await requireUser(identity);
  if (!isAdmin(admin.role)) throw new Error("Forbidden");
  const [request] = await db.select({ userId: paymentRequests.userId })
    .from(paymentRequests).where(eq(paymentRequests.id, paymentRequestId)).limit(1);
  if (!request) return;
  await audit(admin.id, "payment.receipt_viewed", paymentRequestId, request.userId);
}

// --- Admin: approve (pending_review -> approved, atomic subscription activation) ---

export async function approvePaymentRequest(identity: PlatformIdentity, id: string, expectedVersion: number) {
  const db = getDb();
  const admin = await requireUser(identity);
  if (!isAdmin(admin.role)) throw new Error("Forbidden");

  const [request] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, id)).limit(1);
  if (!request) throw new Error("Payment request not found");
  if (request.status !== "pending_review") throw new Error("Payment request is not pending review");
  if (request.statusVersion !== expectedVersion) throw Object.assign(new Error("Another admin reviewed this request"), { code: "CONFLICT" });

  const [plan] = await db.select().from(platformPlans).where(eq(platformPlans.code, request.planCode)).limit(1);
  if (!plan || !plan.active) throw new Error("Referenced plan is unavailable");
  if (plan.priceEgp !== request.priceEgpSnapshot) throw new Error("Plan price has changed since request");
  if (request.amountPaid !== request.priceEgpSnapshot) throw new Error("Payment amount does not match plan price");

  const startsAt = nowIso();
  const sqlClient = getSql();
  const [auditRows] = await sqlClient.transaction([
    sqlClient`
      WITH claimed AS (
        UPDATE public.payment_requests AS pr
        SET status = 'approved', reviewed_by = ${admin.id}, reviewed_at = ${startsAt},
            status_version = pr.status_version + 1, updated_at = ${startsAt}
        FROM public.platform_plans AS pp
        WHERE pr.id = ${id}
          AND pr.status = 'pending_review'
          AND pr.status_version = ${expectedVersion}
          AND pp.code = pr.plan_code
          AND pp.active = true
          AND pp.price_egp = pr.price_egp_snapshot
        RETURNING pr.id, pr.user_id, pr.plan_code, pr.duration_days_snapshot
      ), active AS (
        SELECT us.id, us.user_id, us.plan_code, us.expires_at
        FROM public.user_subscriptions AS us
        JOIN claimed ON claimed.user_id = us.user_id
        WHERE us.status = 'active'
        FOR UPDATE
      ), extended AS (
        UPDATE public.user_subscriptions AS us
        SET expires_at = GREATEST(us.expires_at, ${startsAt}::timestamptz) + (claimed.duration_days_snapshot * interval '1 day'),
            updated_at = ${startsAt}, payment_request_id = claimed.id
        FROM claimed
        WHERE us.id = (SELECT active.id FROM active WHERE active.plan_code = claimed.plan_code LIMIT 1)
        RETURNING us.id
      ), cancelled AS (
        UPDATE public.user_subscriptions AS us
        SET status = 'cancelled', updated_at = ${startsAt}
        FROM claimed
        WHERE us.id IN (SELECT active.id FROM active WHERE active.plan_code <> claimed.plan_code)
        RETURNING us.id
      ), created AS (
        INSERT INTO public.user_subscriptions (user_id, plan_code, status, starts_at, expires_at, payment_request_id)
        SELECT claimed.user_id, claimed.plan_code, 'active', ${startsAt},
               ${startsAt}::timestamptz + (claimed.duration_days_snapshot * interval '1 day'), claimed.id
        FROM claimed
        WHERE NOT EXISTS (SELECT 1 FROM active WHERE active.plan_code = claimed.plan_code)
        RETURNING id
      )
      INSERT INTO public.payment_audit_logs (actor_user_id, action, payment_request_id, user_id, metadata)
      SELECT ${admin.id}, 'payment.approved', claimed.id, claimed.user_id,
             jsonb_build_object('planCode', claimed.plan_code)
      FROM claimed
      RETURNING id
    `,
  ]);
  if (!Array.isArray(auditRows) || auditRows.length === 0) {
    throw Object.assign(new Error("Another admin reviewed this request"), { code: "CONFLICT" });
  }

  return serializePayment({
    ...request,
    status: "approved",
    reviewedBy: admin.id,
    reviewedAt: startsAt,
    statusVersion: expectedVersion + 1,
    updatedAt: startsAt,
  });
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

  const reviewedAt = nowIso();
  const sqlClient = getSql();
  const [auditRows] = await sqlClient.transaction([
    sqlClient`
      WITH claimed AS (
        UPDATE public.payment_requests AS pr
        SET status = 'rejected', rejection_reason = ${reason}, reviewed_by = ${admin.id}, reviewed_at = ${reviewedAt},
            status_version = pr.status_version + 1, updated_at = ${reviewedAt}
        WHERE pr.id = ${id} AND pr.status = 'pending_review' AND pr.status_version = ${expectedVersion}
        RETURNING pr.id, pr.user_id
      )
      INSERT INTO public.payment_audit_logs (actor_user_id, action, payment_request_id, user_id, metadata)
      SELECT ${admin.id}, 'payment.rejected', claimed.id, claimed.user_id, jsonb_build_object('reason', ${reason})
      FROM claimed
      RETURNING id
    `,
  ]);
  if (!Array.isArray(auditRows) || auditRows.length === 0) throw Object.assign(new Error("Another admin reviewed this request"), { code: "CONFLICT" });
  return serializePayment({ ...request, status: "rejected", rejectionReason: reason, reviewedBy: admin.id, reviewedAt, statusVersion: expectedVersion + 1, updatedAt: reviewedAt });
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

  const reviewedAt = nowIso();
  const sqlClient = getSql();
  const [auditRows] = await sqlClient.transaction([
    sqlClient`
      WITH claimed AS (
        UPDATE public.payment_requests AS pr
        SET status = 'needs_info', info_request_reason = ${reason}, reviewed_by = ${admin.id}, reviewed_at = ${reviewedAt},
            status_version = pr.status_version + 1, updated_at = ${reviewedAt}
        WHERE pr.id = ${id} AND pr.status = 'pending_review' AND pr.status_version = ${expectedVersion}
        RETURNING pr.id, pr.user_id
      )
      INSERT INTO public.payment_audit_logs (actor_user_id, action, payment_request_id, user_id, metadata)
      SELECT ${admin.id}, 'payment.info_requested', claimed.id, claimed.user_id, jsonb_build_object('reason', ${reason})
      FROM claimed
      RETURNING id
    `,
  ]);
  if (!Array.isArray(auditRows) || auditRows.length === 0) throw Object.assign(new Error("Another admin reviewed this request"), { code: "CONFLICT" });
  return serializePayment({ ...request, status: "needs_info", infoRequestReason: reason, reviewedBy: admin.id, reviewedAt, statusVersion: expectedVersion + 1, updatedAt: reviewedAt });
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
 * Resolves the guest limit from the immutable payment snapshot for a paid
 * subscription, so later plan edits cannot change a sold entitlement.
 * Returns `null` for unlimited plans (e.g. signature).
 * When the user has no active subscription, defaults to the free "starter" plan.
 */
export async function getGuestLimitForUser(userId: string): Promise<number | null> {
  const sub = await getActiveSubscription(userId);
  if (sub?.paymentRequestId) {
    const [snapshot] = await getDb().select({ guestLimit: paymentRequests.guestLimitSnapshot })
      .from(paymentRequests)
      .where(eq(paymentRequests.id, sub.paymentRequestId))
      .limit(1);
    if (snapshot) return snapshot.guestLimit ?? null;
  }
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

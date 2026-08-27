# Wisal Phase 1 — Payment Integration Architecture

> Status: Implemented and verified
> Owner: platform team
> Depends on: Phase 0A (done), `lib/payments.ts` + 10 API routes + `db/neon-migrations/0012_payment_domain.sql` (done by Hermes)
> Blocks: Any production beta that charges real money
> Related: `docs/MANUAL-PAYMENT-DOMAIN-SPEC.md`, `tests/payments.test.ts`

## 1. Current state (what Hermes delivered)

| Layer | Status | Notes |
|-------|--------|-------|
| Schema | ✅ | `paymentRequests`, `userSubscriptions`, `paymentAuditLogs` in `db/schema.ts` |
| Migration | ✅ | `db/neon-migrations/0012_payment_domain.sql` |
| Domain logic | ✅ | `lib/payments.ts` (create/submit/cancel/get/approve/reject/requestInfo/list + subscription activation + audit) |
| Receipt storage | ✅ | `lib/payment-storage.ts` (magic-byte verified upload) |
| API routes | ✅ | 10 routes (customer + admin), all with auth + `forbiddenUnless` |
| Receipt 403 | ✅ | `app/api/media/[...key]/route.ts` lines 9-12 (SEC-R04) |
| Tests | ✅ | `tests/payments.test.ts` (happy path + edge cases) |
| **App integration** | ✅ | Active subscriptions enforce guest limits and paid-template access; existing invitations remain unaffected. |
| **UI** | ✅ | Checkout, receipt upload, payment tracking, customer plan card, and admin review queue are live. |

**Conclusion:** the payment system is integrated end-to-end. Paid plan selection opens checkout; receipt submission creates a reviewable request; approval activates the subscription; and server-side entitlements enforce guest limits and premium-template access.

## 2. Architectural decisions

### D1 — Subscription is the single source of truth
`getActiveSubscription(userId)` (`lib/payments.ts:274`) is the ONLY way the app learns a user's plan. It returns the active `userSubscriptions` row (planCode + expiresAt). No other module may infer plan from role, email, or UI state.

### D2 — Free vs paid plans
- **Starter** (`priceEgp: 0`, `guestLimit: 50`): no payment. Auto-activated.
- **Elegant** (`899`, `250`) / **Signature** (`1699`, unlimited): require payment request + admin approval.
- Default when no subscription exists: treat as **Starter** (free, 50 guests) so pre-payment beta users are not blocked. Paid benefits unlock only after approval.

### D3 — Payment flow (paid plans)
```
homepage "Choose plan" (paid)
  → choosePlan(code)
  → if unauthenticated: /auth/sign-in?returnTo=/checkout?plan=code
  → /checkout?plan=code
       POST /api/payments            { planCode, idempotencyKey }   → draft
       PATCH /api/payments/[id]/submit (formData receipt + method)  → pending_review
  → status screen "Under review"
  → admin approves → userSubscriptions activated (backend already does this)
  → user notified, can now create event with that plan's limits
```

### D4 — Guest-limit enforcement (server-side)
On `createEvent` and guest import/add, the server:
1. Calls `getActiveSubscription(ownerId)`.
2. Resolves `guestLimit` from `platformPlans` for the subscription's `planCode` (null = unlimited).
3. Rejects with `409` + clear bilingual message if the event/import would exceed the limit.
Client shows the limit in the dashboard and disables "add guest" past the cap.

### D5 — Premium template gating (optional, phase 1.3)
`signature` plan unlocks cinematic/luxury template categories. Gating is read-only from the active subscription; never blocks existing published invitations.

## 3. Precise integration points (file/function changes)

### 3.1 User — Checkout + status (new files)
- `app/checkout/page.tsx` (or `app/(payment)/checkout`) — server component, reads `?plan=`, calls `getPublicPlatformConfig` for price, renders instructions + receipt upload form (`PATCH /api/payments/[id]/submit`).
- `app/checkout/[id]/status.tsx` — polls `GET /api/payments/[id]`, shows draft/pending_review/approved/rejected.
- `lib/use-subscription.ts` — client hook wrapping `getActiveSubscription` for dashboard badges.

### 3.2 `choosePlan` rewire (`app/page.tsx:437`)
- Paid plan → `router.push('/checkout?plan=' + code)` (after auth).
- Free plan → keep current `setSelectedPlan` + event creation (auto starter sub).

### 3.3 `createEvent` enforcement (`lib/wisal-data.ts:163`)
- Accept optional `planCode` (for free auto-activation) OR resolve from `getActiveSubscription(ownerEmail)`.
- Enforce `guestLimit` on creation and on guest import (`lib/guest-data.ts`).

### 3.4 Admin — Payments section (`app/admin-dashboard.tsx`)
- Add `AdminSection = "payments"` + nav item (Receipt icon).
- New section component `AdminPayments` fetches `GET /api/admin/payments`, renders rows with approve/reject/request-info (`PATCH /api/admin/payments/[id]/*`) and receipt link (`GET /api/admin/payments/[id]/receipt`).
- `getAdminOverview` (admin-data.ts) gains `paymentsPending` count for the nav badge.

### 3.5 Dashboard plan card (`app/page.tsx` workspace)
- Show active plan name + expiry, or "Complete payment" CTA linking to `/checkout`.

## 4. Build sequence

| Step | Scope | Verification |
|------|-------|--------------|
| 1.1 | `createEvent` + guest import enforce `guestLimit` via `getActiveSubscription` | unit + runtime tests on `lib/wisal-data.ts` |
| 1.2 | Admin "Payments" section (list + approve/reject/request-info + receipt) | source-contract + manual |
| 1.3 | User checkout page (create + submit receipt) + status screen | runtime test against API |
| 1.4 | `choosePlan` rewire (paid → checkout) + dashboard plan card | e2e-style test |
| 1.5 | Premium template gating (signature) | source-contract |
| 1.6 | Remove "payment paused" copy (homepage:636); flip to live | content test |

## 5. Definition of done
- A user can pick a paid plan, upload a receipt, and an admin can approve it; the subscription then gates guest limits.
- Free plan works with zero payment.
- `getActiveSubscription` is the only plan resolver; no hardcoded plan logic elsewhere.
- All 10 API routes have UI consumers.
- `node --test tests/*.test.mjs` + `tests/payments.test.ts` green; `tsc --noEmit` clean; `eslint` clean; `next build` passes.
- No secrets, receipts served only via private routes (403 on public media).

## 6. Open questions for owner
1. Should approval auto-notify the user (email/notification)? `support-data.ts` has notifications — wire it.
2. Expired subscription behavior: block new guests or degrade to starter? (Recommend: block new guest adds, keep existing live.)
3. Starter auto-activation: on first event or on account creation? (Recommend: lazy on first event.)

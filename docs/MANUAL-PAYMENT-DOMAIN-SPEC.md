# Manual Payment Domain Specification

> **Status:** Approved specification for Phase 1 implementation
>
> **Scope:** Documentation only — no database changes, no API endpoints, no UI in this phase
>
> **Last updated:** 2026-08-27

---

## 1. Overview

Wisal uses a manual payment workflow where customers submit payment requests through the platform, and administrators review and approve them. This document defines the business rules, state machine, security requirements, and implementation constraints for the payment system.

---

## 2. Payment Request State Machine

```
draft → pending_review → approved
   |           |             |
   |           +→ needs_info
   |           +→ rejected
   +→ cancelled

needs_info → pending_review | cancelled
```

### State Definitions

| State | Description | Who sets it |
|-------|-------------|-------------|
| `draft` | Payment request created but not yet submitted | System (auto) |
| `pending_review` | Receipt uploaded, awaiting admin review | Customer |
| `needs_info` | Admin requests additional information | Admin |
| `rejected` | Admin rejected with reason | Admin |
| `approved` | Admin approved, plan activated | Admin |
| `cancelled` | Customer cancelled the request | Customer |

### State Transition Rules

1. `draft → pending_review`: Customer uploads receipt and submits
2. `pending_review → needs_info`: Admin requests more information
3. `pending_review → approved`: Admin approves (terminal)
4. `pending_review → rejected`: Admin rejects (terminal)
5. `needs_info → pending_review`: Customer provides requested info
6. `needs_info → cancelled`: Customer cancels
7. `draft → cancelled`: Customer cancels before submitting

### Terminal States

- `approved`: Plan is activated, no further transitions
- `rejected`: Request is closed, no further transitions

---

## 3. Permissions Model

### Payment-Specific Permissions

| Permission | Description | Roles |
|-----------|-------------|-------|
| `payments.create` | Create payment requests | couple |
| `payments.read_own` | View own payment requests | couple |
| `payments.submit` | Submit receipt for review | couple |
| `payments.cancel_own` | Cancel own draft/pending request | couple |
| `payments.read_all` | View all payment requests | admin |
| `payments.review` | Approve/reject/request info | admin |
| `payments.read_status` | View payment status (read-only) | support |
| `subscriptions.read_own` | View own subscription status | couple |
| `subscriptions.manage` | Manage subscription lifecycle | admin |

### Permission Enforcement

- All payment endpoints require authentication
- `payments.read_own` and `payments.submit` verify the requesting user owns the payment request
- `payments.review` requires admin role
- `payments.read_status` is support-only, no write access
- Platform owner cannot be demoted (existing rule)

---

## 4. Payment Request Data Model

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References users table |
| `plan_code` | TEXT | References platform_plans.code |
| `status` | TEXT | Current state (see state machine) |

### Plan Snapshot Fields (Immutable after creation)

| Field | Type | Description |
|-------|------|-------------|
| `plan_name_snapshot` | TEXT | Plan display name at time of request |
| `price_egp_snapshot` | INTEGER | Price in EGP at time of request |
| `currency` | TEXT | Always "EGP" |
| `guest_limit_snapshot` | INTEGER | Guest limit at time of request |
| `duration_days_snapshot` | INTEGER | Plan duration in days |

### Payment Details (Customer-provided)

| Field | Type | Description |
|-------|------|-------------|
| `payment_method` | TEXT | instapay, vodafone_cash, etisalat_cash, bank_transfer |
| `amount_paid` | INTEGER | Amount paid in EGP |
| `reference_number` | TEXT | Transaction reference |
| `payer_name` | TEXT | Name on payment (optional) |
| `payer_phone_masked` | TEXT | Last 4 digits only (optional) |

### Receipt Fields

| Field | Type | Description |
|-------|------|-------------|
| `receipt_key` | TEXT | Storage key (never public) |
| `receipt_mime` | TEXT | MIME type (image/jpeg, image/png, image/webp, application/pdf) |
| `receipt_size` | INTEGER | File size in bytes |
| `receipt_checksum` | TEXT | SHA-256 hash of file content |

### Review Fields

| Field | Type | Description |
|-------|------|-------------|
| `reviewed_by` | UUID | References users table (admin who reviewed) |
| `reviewed_at` | TIMESTAMPTZ | When review occurred |
| `rejection_reason` | TEXT | Customer-visible rejection reason |
| `admin_notes` | TEXT | Internal admin notes (not visible to customer) |
| `info_request_reason` | TEXT | What additional info is needed |

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `idempotency_key` | TEXT | Unique key for duplicate prevention |
| `status_version` | INTEGER | Optimistic concurrency control |
| `submitted_at` | TIMESTAMPTZ | When customer submitted |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

---

## 5. Subscription Lifecycle

### Subscription States

| State | Description |
|-------|-------------|
| `active` | Plan is currently active |
| `expired` | Plan duration has ended |
| `cancelled` | Subscription cancelled by user or admin |
| `suspended` | Subscription suspended (payment issue) |

### Subscription Creation

- Created when a payment request is approved
- `starts_at` = approval timestamp
- `expires_at` = starts_at + plan duration_days (from snapshot)
- Only one active subscription per user at a time

### Plan Upgrade

- New payment request created for higher-tier plan
- On approval: old subscription cancelled, new one created
- Price difference handled by admin (no automated proration)

### Plan Renewal

- New payment request created for same plan
- On approval: existing subscription expiry extended
- If expired: new subscription created from approval date

### Plan Downgrade

- Not supported in Phase 1
- Admin handles manually outside the system

### Subscription Expiry

- Checked on each API request
- If expired: user reverts to starter (free) plan
- Guest limit enforcement reverts to starter limits
- Published invitations remain accessible

---

## 6. Idempotency Protection

### Duplicate Submission Prevention

- Each payment request has a unique `idempotency_key`
- Server rejects duplicate keys with 409 Conflict
- Key is generated client-side using `crypto.randomUUID()`

### Duplicate Approval Prevention

- On approval, server checks `status_version`
- If version doesn't match, returns 409 (optimistic concurrency)
- Repeated approval of already-approved request returns existing result
- No duplicate subscription creation

### Concurrent Request Prevention

- Only one `pending_review` or `pending_submission` request per user
- Enforced with partial unique index in database
- Second submission returns 409 with message "A payment request is already under review"

---

## 7. Transaction Boundaries

### Approval Transaction

All operations in a single database transaction:

1. Authenticate reviewer, require `payments.review` permission
2. Lock payment request row (`SELECT ... FOR UPDATE`)
3. Verify status is `pending_review`
4. Load referenced active plan from `platform_plans`
5. Validate plan_code and price_egp_snapshot match
6. Create or update subscription:
   - If no active subscription: create new
   - If active subscription for same plan: extend expiry
   - If active subscription for different plan: cancel old, create new
7. Update payment request: status=approved, reviewed_by, reviewed_at
8. Insert audit event: `payment.approved`
9. Commit transaction atomically

### Rollback Scenarios

- Plan not found or inactive: rollback, return error
- Price mismatch: rollback, return error
- Database error: automatic rollback
- Any exception: automatic rollback

---

## 8. Receipt Privacy Requirements

### Storage — Critical Design Constraint

**Receipts MUST NOT be stored in the public media namespace.**

> **HARD ENFORCEMENT (SEC-R04):** The public route at `app/api/media/[...key]/route.ts` MUST reject any key beginning with `receipts/` and return `403 Forbidden`. This is a build-time/code-review gate, not optional guidance. The private receipt route is the only path that may serve receipt blobs, and only after authenticating the requester and verifying ownership or admin role.

The current `app/api/media/[...key]/route.ts` serves all objects from `media_blobs` with public immutable caching. This is appropriate for invitation artwork but MUST NEVER be reused for payment receipts.

**Required approach:** Receipts require a separate authorization boundary:

1. **Separate storage namespace:** Receipts stored in `media_blobs` with key pattern `receipts/{user_id}/{uuid}.{ext}`
2. **Public route blocking:** The public media route MUST reject any key starting with `receipts/` — return 403 for `receipts/*` keys
3. **Private receipt route:** A dedicated `GET /api/payments/[id]/receipt` endpoint that:
   - Authenticates the request
   - Verifies the requester owns the payment or has admin role
   - Streams the receipt from `media_blobs` with `private, no-store` cache headers
   - Logs the access in the audit trail

### Access Control

- Customer can view own receipts only (via private route)
- Admin can view all receipts for review (via private route)
- Support cannot access receipts (unless explicitly granted)
- Public media route returns 403 for any `receipts/*` key
- All access logged in audit trail

### File Validation

- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
- Maximum file size: 5 MB
- Content inspection (not just MIME header) to verify actual file type
- Randomized storage keys (never use original filename)

### Retention Policy

- Receipts retained for 12 months after approval
- Rejected receipts retained for 3 months
- Automated deletion after retention period
- Deletion logged in audit trail

### Security

- No receipt URLs in logs, analytics, or error messages
- No receipt data in Open Graph or social previews
- Checksum verified on access to detect tampering
- HTTPS only for all receipt access

---

## 9. Admin Review Workflow

### Review Queue

- Displays all `pending_review` requests
- Sorted by submission date (oldest first)
- Shows: customer name, plan, amount, method, submission date
- Click to view details and receipt

### Review Actions

1. **Approve**: Activates plan, creates/extends subscription
2. **Reject**: Closes request with customer-visible reason
3. **Request Info**: Returns to customer with specific question

### Receipt Viewer

- Inline image viewer for images
- PDF viewer for PDF receipts
- Zoom and pan controls
- Download button for admin records
- Side-by-side with payment details

### Audit Trail

Every review action creates an audit event:
- `payment.approved`: Admin approved payment
- `payment.rejected`: Admin rejected with reason
- `payment.info_requested`: Admin requested more information

---

## 10. Customer Payment Flow

### Step 1: Plan Selection

- Customer selects a plan from pricing page
- System creates payment request in `draft` status
- Plan snapshot captured at creation time

### Step 2: Payment Instructions

- System displays payment methods and instructions
- Instructions are bilingual (Arabic/English)
- Admin-configurable per payment method

### Step 3: Receipt Upload

- Customer uploads receipt image or PDF
- File validated (type, size, content)
- Receipt stored privately
- Payment request moves to `pending_review`

### Step 4: Status Tracking

- Customer sees payment status in dashboard
- Status updates: submitted → under review → approved/rejected
- If rejected: reason displayed, option to resubmit
- If info requested: specific question displayed

### Step 5: Plan Activation

- On approval: plan activated immediately
- Customer sees updated plan in dashboard
- Guest limits enforced immediately
- New template access granted

---

## 11. Payment Methods

### Supported Methods (Egypt)

| Method | Display Name (AR) | Display Name (EN) | Instructions |
|--------|-------------------|-------------------|--------------|
| `instapay` | InstaPay | InstaPay | Transfer to specified account, enter reference |
| `vodafone_cash` | فودافون كاش | Vodafone Cash | Send to specified number, enter reference |
| `etisalat_cash` | اتصالات كاش | Etisalat Cash | Send to specified number, enter reference |
| `bank_transfer` | تحويل بنكي | Bank Transfer | Transfer to specified account, enter reference |

### Admin Configuration

- Payment method instructions stored in `platform_content`
- Bilingual instructions per method
- Account details managed by admin
- Instructions displayed to customer during payment

---

## 12. Error Handling

### Customer Errors

| Error | Message | Action |
|-------|---------|--------|
| Invalid file type | "Please upload an image or PDF" | Retry with valid file |
| File too large | "File must be under 5 MB" | Retry with smaller file |
| Duplicate submission | "A payment request is already under review" | Wait or cancel existing |
| Network error | "Could not submit. Please try again." | Retry |

### Admin Errors

| Error | Message | Action |
|-------|---------|--------|
| Price mismatch | "Plan price has changed since request" | Verify and retry |
| Concurrent review | "Another admin reviewed this request" | Refresh and retry |
| Receipt not found | "Receipt file not available" | Check storage |

---

## 13. Implementation Constraints

### Phase 1 Scope

- Manual payment request creation
- Receipt upload and private storage
- Admin review queue and actions
- Subscription activation on approval
- Basic audit logging

### Out of Scope (Phase 1)

- Automated payment gateways
- Subscription renewal automation
- Refund processing
- Payment analytics dashboard
- Multi-currency support
- Tax calculation

### Database Changes Required

- `payment_requests` table
- `user_subscriptions` table
- `payment_audit_logs` table
- Partial unique index for concurrent request prevention
- Foreign key constraints

### API Endpoints Required

- `POST /api/payments` — Create payment request
- `PATCH /api/payments/[id]/submit` — Submit receipt
- `GET /api/payments/[id]` — Get payment status
- `GET /api/payments/[id]/receipt` — View own receipt (customer, private route)
- `PATCH /api/payments/[id]/cancel` — Cancel request
- `GET /api/admin/payments` — List all payments (admin)
- `PATCH /api/admin/payments/[id]/approve` — Approve payment
- `PATCH /api/admin/payments/[id]/reject` — Reject payment
- `PATCH /api/admin/payments/[id]/request-info` — Request information
- `GET /api/admin/payments/[id]/receipt` — View receipt (admin, private route)

---

## 14. Acceptance Criteria

### Customer Journey

- [ ] Customer can select a paid plan
- [ ] Customer sees payment instructions for chosen method
- [ ] Customer can upload receipt (image or PDF)
- [ ] Customer sees payment status in dashboard
- [ ] Customer receives clear error messages
- [ ] Customer can cancel pending request
- [ ] Plan activates immediately on approval

### Admin Journey

- [ ] Admin sees pending payment requests
- [ ] Admin can view receipt inline
- [ ] Admin can approve with one click
- [ ] Admin can reject with required reason
- [ ] Admin can request specific information
- [ ] All actions are audited
- [ ] Concurrent review is prevented

### Security

- [ ] Receipts are never publicly accessible
- [ ] Public media route returns 403 for `receipts/*` keys
- [ ] Customer can only view own receipts via private route
- [ ] Admin review requires admin role
- [ ] Duplicate submissions are prevented
- [ ] Price tampering is detected
- [ ] All access is logged

### Data Integrity

- [ ] Plan snapshot is immutable after creation
- [ ] Subscription creation is atomic
- [ ] Approval transaction rolls back on error
- [ ] Status transitions are enforced
- [ ] Audit trail is complete

---

*End of specification. This document should be reviewed by the development team before implementing Phase 1.*

# Wisal — Reviewed Product, UX, Security and Launch Audit

> **Status:** Corrected review of `OPENCODE-FULL-PRODUCT-AUDIT.md`
>
> **Review date:** 2026-08-27
>
> **Scope:** Evidence-backed review of the current repository. No production deployment, database mutation, or product-code change was performed.

## 1. Executive Summary

Wisal already has a substantial product foundation: bilingual authentication, Google sign-in integration through Neon Auth, invitation creation and publishing, six current invitation concepts, guest management, RSVP, platform administration, support, and a public marketing experience. The original OpenCode audit correctly identified the absence of a commercial payment workflow and the weakness of runtime test coverage, but it materially understated the existing authentication implementation and incorrectly treated several implemented accessibility features as absent.

The project is **not commercially launch-ready** because payment requests, private receipt storage, admin payment review, subscription activation, and plan enforcement do not exist. It is, however, considerably closer to a controlled beta than the original `42/100` score suggests.

### Corrected readiness assessment

| Area | Score | Evidence-based status |
|---|---:|---|
| Product foundation | 72/100 | Core invitation and guest journeys exist |
| UI quality | 74/100 | Strong visual direction; requires systematic visual QA |
| Invitation experience | 76/100 | Six differentiated concepts and semantic styling exist |
| Authentication | 70/100 | Email/password and Google flows exist; production configuration needs E2E verification |
| Authorization | 62/100 | Role permission layer exists; owner identity handling needs correction |
| Payment readiness | 5/100 | Commercial payment workflow does not exist |
| Admin readiness | 58/100 | Platform operations exist; payment operations do not |
| Accessibility | 62/100 | Focus styles and reduced-motion rules exist; gaps remain in modal focus and document language |
| RTL/LTR | 68/100 | Component-level support exists; root document language/direction is static |
| Testing | 45/100 | Broad source-contract coverage, little runtime/E2E assurance |
| Production operations | 40/100 | Missing error tracking, commercial monitoring, and payment operational controls |

**Corrected overall readiness: 59/100.** This is a reasoned planning score, not a measured compliance certification.

## 2. Corrections to the OpenCode Audit

### [REV-001] Google OAuth was incorrectly reported as missing

- **Status:** Confirmed report error
- **Original claim:** Google OAuth is not implemented.
- **Evidence:**
  - `app/auth/auth-form.tsx` initiates `/api/auth/sign-in/social` with `provider: "google"`.
  - `app/auth/connect-google/connect-google-card.tsx` implements account-linking UX.
  - `app/api/auth/[...path]/route.ts` dispatches requests to Neon Auth.
  - `lib/auth/server.ts` configures `@neondatabase/auth`.
- **Correct conclusion:** Google authentication exists in source. The remaining task is production configuration and end-to-end verification of provider credentials, callback URLs, account linking, errors, and session persistence.
- **Priority:** P0 verification; not a new implementation project.

### [REV-002] Email/password authentication was incorrectly described as non-standard or unavailable

- **Status:** Confirmed report error
- **Evidence:** `app/auth/auth-form.tsx` contains sign-up and sign-in requests, while forgot/reset-password pages exist.
- **Correct conclusion:** Both email/password and Google entry points exist. Runtime verification remains required because source presence does not prove provider configuration.

### [REV-003] Focus indicators were incorrectly reported as absent

- **Status:** Confirmed report error
- **Evidence:** Focus-visible rules exist in `app/wisal-atlas.css` and across invitation, workspace, dashboard, admin, and form selectors in `app/globals.css`.
- **Correct conclusion:** Focus styling exists but needs keyboard coverage testing for every interactive component. The issue is incomplete verification, not total absence.

### [REV-004] The hardcoded owner email was misclassified as a credential

- **Status:** Confirmed issue with incorrect risk explanation
- **Evidence:** `lib/admin-data.ts` and `lib/account-data.ts` contain a fixed owner email.
- **Actual risk:** Repository privacy leak, environment coupling, implicit elevation by identity, and operational difficulty changing the owner. Knowing the email alone does not authenticate an attacker.
- **Severity:** High configuration/authorization design issue, not a leaked password or token.
- **Required correction:** Centralize a validated `PLATFORM_OWNER_EMAIL`, stop repeating it across modules, test owner elevation, and document rotation/bootstrap behavior.

### [REV-005] A real owner-protection mismatch was missed

- **Status:** Confirmed bug
- **Evidence:** The server protects the fixed owner email from demotion, while `app/admin-dashboard.tsx` disables role editing only for `owner@wisal.app`.
- **Impact:** The UI and server disagree about which account is immutable. The server should remain authoritative, but the UX exposes an action that will fail.
- **Priority:** P0.

### [REV-006] The performance claim about `page.tsx` was overstated

- **Status:** Unsupported claim
- **Original claim:** The 1,300-line page is included in all routes.
- **Correct conclusion:** The file is a maintainability and testability concern. Next.js route graphs require bundle measurement before claiming that it ships on every route.
- **Priority:** P1 maintainability; performance impact must be measured.

### [REV-007] The media finding requires scope separation

- **Status:** Confirmed architectural constraint
- **Evidence:** `app/api/media/[...key]/route.ts` serves objects publicly with immutable caching.
- **Correct conclusion:** This can be appropriate for public invitation artwork. It must never be reused for payment receipts. Private financial evidence requires a separate authorization boundary and private caching policy.

## 3. Current Product and Architecture

### Confirmed capabilities

- Next.js App Router application using React, TypeScript, and CSS.
- Neon PostgreSQL through Drizzle-based data access.
- Neon Auth integration with email/password and Google entry points.
- Account roles: `admin`, `support`, `content_manager`, and `couple`.
- Permission checks for Admin API routes through `forbiddenUnless`.
- Event and invitation creation, editing, publication, and personalized guest links.
- Guest management, groups, imports, segments, RSVP responses, and WhatsApp-assisted sharing.
- Six current invitation concepts while retaining older template records.
- Platform template, plan, content, support, and audit administration.
- Public-request body-size, origin, and in-memory rate controls.
- Bilingual Arabic/English component experiences.

### Confirmed missing commercial capabilities

- Payment request entity and lifecycle.
- Receipt upload and private receipt retrieval.
- Admin payment review queue.
- Approval/rejection/needs-information workflow.
- Subscription activation and expiration.
- Plan entitlement enforcement.
- Payment-specific audit trail.
- Customer-visible payment history and status.
- Refund/cancellation operational policy.

## 4. Role and Permission Review

| Role | Current capability | Required payment capability |
|---|---|---|
| Visitor | Browse and preview | View accurate plans and payment explanation |
| Couple | Manage owned events and guests | Create/view own payment requests and receipts |
| Support | Support operations | View status only if explicitly granted; no approval by default |
| Content manager | Templates/content | No receipt or payment access |
| Admin | Platform administration | Review payments, approve/reject, activate plans, audit actions |
| Platform owner | Implicit admin bootstrap | Controlled bootstrap/rotation without scattered email constants |

Payment permissions should be explicit, for example `payments.read`, `payments.review`, and `subscriptions.manage`, rather than folded into general Admin access.

## 5. Critical User Journeys

| Journey | Current state | Launch status |
|---|---|---|
| Browse templates | Implemented | Verify desktop/mobile previews |
| Email sign-up/sign-in | Implemented in source | Production E2E required |
| Google sign-in/linking | Implemented in source | Production E2E required |
| Create and edit invitation | Implemented | Regression tests required |
| Publish and share | Implemented | Runtime slug/share tests required |
| Guest RSVP | Implemented | Runtime authorization and concurrency tests required |
| Select a paid plan | Presentation only | Blocked |
| Submit manual payment | Missing | Blocked |
| Admin verifies payment | Missing | Blocked |
| Activate exact selected plan | Missing | Blocked |
| Renewal/upgrade/expiry | Missing | Blocked for recurring commercial operation |

## 6. UI/UX and Visual Design Review

### Strengths to preserve

- Distinctive premium visual direction rather than a generic SaaS landing page.
- Six invitation identities with shared semantic styling foundations.
- Arabic and English content paths.
- Invitation opening, hero, countdown, schedule, RSVP, and utility controls.
- Homepage template showcase aligned with the invitation concepts.
- Clear public statement that payments are not active, avoiding a false commercial claim.

### Remaining work

1. Conduct screenshot-based visual regression checks at approximately 390px, tablet, and 1440px.
2. Validate actual contrast values for every concept; CSS token presence alone is insufficient.
3. Verify long Arabic names, long venues, multiple schedule segments, and empty optional content.
4. Test opening animations on low-end mobile hardware and reduced-motion mode.
5. Verify modal focus entry, containment, Escape behavior, and focus restoration.
6. Ensure every homepage preview accurately matches its production invitation concept.
7. Validate loading, empty, error, rejected-payment, needs-information, and expired-plan states when payment is added.

## 7. Accessibility and Language Review

### Confirmed strengths

- Multiple `:focus-visible` systems exist.
- Semantic labels and alert roles are present in major forms.
- Reduced-motion rules exist for invitation experiences.
- Direction is set on major page surfaces.

### Confirmed or probable gaps

- Root `<html lang="en" dir="ltr">` is static.
- No global skip-to-content link was confirmed.
- Dialogs expose `role="dialog"` but require runtime focus testing.
- Error messages are not consistently associated with individual fields.
- Contrast needs measurement rather than visual estimation.
- Touch target size and zoom/reflow require device testing.

### Correct root-language approach

Persist the selected locale in a server-readable cookie, render `lang` and `dir` from that value where compatible with the current Next.js architecture, and update the cookie when the client switches language. Test hydration and first paint before shipping.

## 8. Security Review

### [SEC-R01] Owner identity duplicated and hardcoded

- **Severity:** High
- **Priority:** P0
- **Fix direction:** One validated server-only configuration source, explicit bootstrap behavior, and tests.

### [SEC-R02] Owner identity mismatch between UI and server

- **Severity:** High
- **Priority:** P0
- **Fix direction:** Return an authoritative `isPlatformOwner` capability to the UI or enforce immutable-role behavior without duplicating identity strings.

### [SEC-R03] In-memory public rate limiter is not globally consistent

- **Severity:** Medium for beta; High when exposed to material abuse or payment upload
- **Priority:** P1 before commercial launch
- **Fix direction:** Distributed rate limiting or a database-backed abuse ledger. Apply separate limits to authentication, RSVP, support, and receipt submissions.

### [SEC-R04] Public media route must not serve payment evidence

- **Severity:** Critical if reused for receipts
- **Priority:** P0 design constraint
- **Fix direction:** Private object namespace, authorization checks, short-lived access, safe MIME validation, and `private, no-store` responses.

### [SEC-R05] Authenticated mutation CSRF posture needs verification

- **Severity:** Probable Medium
- **Priority:** P1
- **Required evidence:** Confirm Neon Auth cookie `SameSite`, origin validation, and whether state-changing routes accept cross-site requests. Do not add token complexity until the actual cookie posture is established.

### [SEC-R06] No evidence of raw SQL injection was confirmed

Drizzle query construction is used in reviewed data paths. Continue validating all new payment inputs server-side and never trust price, plan entitlement, status, or reviewer identity from the client.

## 9. Manual Payment Workflow

### Required state machine

```text
draft -> pending_review -> approved
   |           |             |
   |           +-> needs_info
   |           +-> rejected
   +-> cancelled

needs_info -> pending_review | cancelled
```

`approved` must be terminal for the payment request. Subscription suspension, expiry, renewal, and cancellation belong to the subscription lifecycle, not the payment-request state.

### Required transaction on approval

1. Authenticate the reviewer and require `payments.review`.
2. Lock the payment request row.
3. Verify it is still `pending_review`.
4. Load the referenced active plan from the database.
5. Validate the immutable plan/price snapshot stored with the request.
6. Create or update the subscription according to an explicit renewal/upgrade policy.
7. Mark the request approved and record reviewer/time.
8. Insert an immutable audit event.
9. Commit all operations atomically.

Repeated approval must return the existing successful result without creating another entitlement.

### Minimum payment request data

- `id`, `user_id`, and immutable `plan_code`.
- Plan name, price, currency, guest limit, and duration snapshots.
- Payment method identifier managed by Admin.
- Declared amount and transfer reference.
- Payer name/phone fields only when operationally required.
- Private `receipt_key`, MIME type, size, and checksum.
- Status and status version.
- `submitted_at`, `reviewed_at`, and reviewer ID.
- User-visible rejection or information-request reason.
- Internal Admin note stored separately.
- Idempotency key and timestamps.

### Receipt security requirements

- Permit only explicitly supported image/PDF formats after content inspection.
- Enforce size, dimensions/page limits, and randomized storage keys.
- Never trust the filename or client MIME header.
- Store privately and authorize every read.
- Do not expose receipts in logs, analytics, Open Graph, or public media caches.
- Define retention and deletion policy before launch.
- Log view/download actions where operationally appropriate.

## 10. Testing Review

The existing suite provides useful source-contract assertions, but most tests inspect source strings rather than execute application behavior. This is a real release risk.

### Required runtime test layers

1. Unit tests for payment state transitions, snapshots, entitlement calculations, and validation.
2. Database integration tests for approval transactions, duplicate approvals, concurrent requests, and rollback.
3. Route tests for ownership, Admin permissions, invalid input, oversized files, and forbidden receipt access.
4. Browser E2E tests for email auth, Google auth callback outcomes, invitation creation, publishing, RSVP, payment submission, and Admin approval.
5. Accessibility checks plus keyboard-only manual verification.
6. Visual regression screenshots for homepage and Editorial, Botanical, and Cinematic invitations on desktop/mobile.

## 11. Production Readiness

### Commercial launch blockers

- Manual payment and receipt workflow.
- Private receipt storage and access control.
- Subscription lifecycle and entitlement enforcement.
- Runtime verification of production authentication.
- Payment terms, rejection policy, cancellation/refund policy, and receipt retention policy.
- Payment and Admin auditability.
- Runtime tests for the money and authorization paths.
- Error tracking and operational alerting for critical flows.

### Beta blockers

- Owner identity mismatch.
- Root language/direction semantics.
- Critical keyboard/modal regressions.
- Verification of invite publishing and RSVP against production-like data.

### Important but not automatic blockers

- Analytics.
- Component extraction from `app/page.tsx`.
- Automated data export/deletion UI.
- Distributed rate limiting at low private-beta traffic, provided exposure is constrained and migration is scheduled before commercial launch.

## 12. Corrected Implementation Roadmap

### Phase 0A — Identity and release verification

**Goal:** Remove known authorization inconsistency and prove current authentication works.

- Centralize and validate platform-owner configuration.
- Remove UI/server owner mismatch.
- Verify email/password, Google sign-in, callback, linking, sign-out, recovery, and session persistence in a production-like environment.
- Add runtime authorization tests for Admin routes.
- Document required environment variables without exposing values.

**Effort:** M  
**Launch blocker:** Yes.

### Phase 0B — Payment contract and private storage design

**Goal:** Freeze the business and security rules before schema work.

- Approve payment states, plan duration, renewal, upgrade, rejection, refund, and expiration rules.
- Define Admin payment methods and customer instructions.
- Define private receipt storage, retention, and access.
- Produce schema and API contract with rollback plan.

**Effort:** M  
**Launch blocker:** Yes.

### Phase 1 — Manual payment vertical slice

**Goal:** Complete one safe path from plan choice to active entitlement.

- Add reviewed migrations.
- Create payment request with server-derived snapshot.
- Upload receipt privately.
- Show customer status.
- Build Admin queue and protected receipt viewer.
- Approve/reject/request information.
- Activate the exact plan atomically.
- Add audit events and idempotency.
- Enforce plan limits in the product.

**Effort:** XL  
**Launch blocker:** Yes.

### Phase 2 — UX, accessibility, and language completion

- Implement server-readable locale strategy.
- Add skip navigation.
- Test and correct modal focus behavior.
- Associate field errors.
- Complete payment empty/loading/error/success states.
- Verify responsive and RTL/LTR behavior.

**Effort:** L  
**Launch blocker:** Accessibility-critical failures only.

### Phase 3 — Runtime quality and observability

- Add unit, integration, and browser E2E coverage.
- Add error tracking with PII filtering.
- Add health and operational monitoring without exposing sensitive internals.
- Add structured audit/search support for payment operations.

**Effort:** L  
**Launch blocker:** Money-path tests and error tracking are required.

### Phase 4 — Maintainability and measured performance

- Extract cohesive modules from `app/page.tsx` without redesigning behavior.
- Measure bundle and Core Web Vitals before optimization.
- Optimize only verified bottlenecks.
- Add visual regression baselines.

**Effort:** L  
**Launch blocker:** No, unless measurement exposes a severe mobile problem.

## 13. Recommended First Implementation Batch

### Batch name: Identity Truth and Payment Contract

This is the smallest safe batch that removes a confirmed defect and prepares the commercial blocker without prematurely committing to a database design.

### Scope

1. Replace duplicated owner-email constants with one validated server-only configuration module.
2. Fix the owner role-control mismatch in the Admin UI.
3. Add runtime tests for owner/admin/support/content/couple permission boundaries.
4. Verify the existing Google and email authentication paths; do not reimplement them.
5. Add a reviewed payment-domain specification covering states, subscriptions, entitlement rules, receipt privacy, and approval idempotency.
6. Do not create payment migrations until that contract is approved.

### Definition of done

- No personal owner email is duplicated across product modules.
- Missing/invalid owner configuration fails safely and clearly.
- The owner cannot be demoted through either UI or API.
- Google/email authentication results are documented from runtime tests.
- Payment state and subscription rules have no unresolved business ambiguity.
- Receipt storage is explicitly private by design.
- The next migration can be reviewed against an approved contract.

## 14. Launch Checklist

### Before implementing payments

- [ ] Approve plan durations and entitlement limits.
- [ ] Approve renewal and upgrade behavior.
- [ ] Approve rejection, cancellation, and refund policy.
- [ ] Approve supported InstaPay/wallet methods and Admin-managed instructions.
- [ ] Approve receipt formats, maximum size, retention, and deletion policy.

### Before commercial launch

- [ ] Complete payment vertical slice.
- [ ] Prove duplicate/concurrent approval safety.
- [ ] Prove receipt access isolation.
- [ ] Verify Google and email authentication in Production.
- [ ] Verify Admin permission boundaries.
- [ ] Publish accurate payment and privacy terms.
- [ ] Add runtime E2E coverage for purchase and activation.
- [ ] Add error tracking and alerts.
- [ ] Run desktop/mobile, RTL/LTR, keyboard, reduced-motion, and contrast checks.
- [ ] Run build, TypeScript, lint, tests, and post-deployment smoke tests.
- [ ] Prepare database and deployment rollback procedures.

## 15. Review Verdict

| Severity | Confirmed count | Status |
|---|---:|---|
| Critical | 1 design constraint | Private receipts must never use public media delivery |
| High | 5 | Payment absence, owner identity, UI/server mismatch, runtime test gap, commercial operations |
| Medium | 5 | Root locale, distributed limiting, modal verification, maintainability, measured performance |
| Low | 0 | Not used for speculative styling preferences |

**Verdict:** The original audit is **blocked as a direct implementation plan**. This reviewed version supersedes its authentication, accessibility, security-severity, performance, and first-batch conclusions. Wisal can proceed with the corrected Phase 0A, then the approved payment vertical slice. No deployment should occur until the relevant batch passes runtime verification and receives explicit approval.


# Wisal Implementation Roadmap

This file is the single source of truth for the next development cycle. Do not start a later phase while P0 acceptance criteria remain unmet.

## Operating rules

- Make one bounded change per pull request; run lint, type-check, relevant unit/contract tests, build and focused desktop/mobile tests.
- Use a non-production Neon database and OAuth client for destructive/auth tests.
- Preserve existing records through additive migrations and backfills; never mass-delete invitation or guest data.
- Record evidence (test run, screenshots where useful, migration result and rollback notes) on each ticket.

## Current execution status

| ID | Status | Evidence / remaining gate |
|---|---|---|
| WIS-001 | Code path implemented; runtime verification pending | An authenticated password user can now reach `/auth/connect-google`, which invokes the provider's explicit `link-social` flow. Targeted auth contracts, lint, TypeScript and production build passed. Verify with an isolated Neon OAuth account before closure. |
| WIS-003 | CI gate operational; release coverage incomplete | The dedicated non-production Neon branch and GitHub Actions secrets are configured. The isolated Owner A/B event-substitution and normal-user admin-denial suite passed on 14 September 2026 ([run 34821961307](https://github.com/Kerolos17/wisal/actions/runs/34821961307)). Guest-token and full role-matrix cases remain before the P0 release gate can close. |

## Phase 0 — Emergency / production blockers

| ID | Task | Problem → solution | Priority | Complexity | Dependencies | Likely files/modules | Acceptance criteria |
|---|---|---|---|---|---|---|---|
| WIS-001 | Safe Google account linking/recovery | Implemented: password-first recovery and authenticated linking handoff are deployed. Keep provider callback/revocation/state regression coverage. | P1 | M | Test OAuth tenant | `app/auth/*`, `lib/auth/*`, provider configuration, E2E | New Google and existing-password cases are documented, tested, and never create/merge the wrong account; invalid state/callback is safe. |
| WIS-003 | Multi-identity security E2E | Preliminary production check and source contracts confirm owner scoping, but source checks cannot prove every tenant boundary. Create Owner A/B, admin/support/content/couple, public/private guests and run negative API/UI tests. | P0 | L | Isolated test DB/auth identities | `tests/e2e`, API routes, fixtures | All object substitutions return 403/404 without PII; private token/segment tests pass. |
| WIS-004 | Production auth/config verification | Env/callback/cookie/provider configuration was unavailable to audit. Add a non-secret deploy verification runbook/check. | P0 | M | Vercel/Neon access | `.env.example`, docs, Vercel settings | Required vars present; prod/preview separated; callback URLs/cookies/reset mail verified; no secret logs. |

## Phase 1 — Core product stability

| ID | Task | Problem → solution | Priority | Complexity | Dependencies | Likely files/modules | Acceptance criteria |
|---|---|---|---|---|---|---|---|
| WIS-002 | Persist English-first defaults | UI defaults English but schema/create fallbacks are Arabic. Add safe migration/backfill policy and locale-aware defaults/errors. | P1 | M | WIS-003 regression suite | `db/schema.ts`, `db/neon-migrations`, `lib/wisal-data.ts`, API errors | New users/events/invites are English/LTR by default; Arabic explicit; existing Arabic content unchanged. |
| WIS-005 | Honest messaging → delivery foundation | Scheduled records do not send. Relabel manual queue now; define provider adapter and worker design before automatic delivery. | P1 | L | Provider/consent decision | `messages`, API, worker, UI | UI never implies sent when it is only queued; provider delivery has idempotency, opt-in, retry/DLQ and per-recipient state before enablement. |
| WIS-011 | RSVP behavior policy | Edit/identity semantics are ambiguous. Define personalized versus public flow, edit window and confirmation. | P1 | M | WIS-003 | `InvitationClient`, `/api/rsvp`, schema | Duplicate/update behavior is predictable; confirmation and dashboard totals remain correct. |
| WIS-012 | Publish/readiness gate | Publishing validates basic fields but needs operational readiness (segments, guest mode, RSVP). | P1 | S | WIS-002 | event API, workspace UI | Clear pre-publish checklist; invalid state cannot publish; published/archived behavior tested. |

## Phase 2 — UI/UX stabilization

| ID | Task | Problem → solution | Priority | Complexity | Dependencies | Likely files/modules | Acceptance criteria |
|---|---|---|---|---|---|---|---|
| WIS-009 | Feature modularization | 1,446-line page and 1,604-line CSS increase regression risk. Extract feature components/primitives without changing contracts. | P1 | L | baseline visual tests | `app/page.tsx`, CSS, new feature dirs | Same behavior/URLs/API requests; no bundle regression; focused unit/visual tests pass. |
| WIS-013 | First-time onboarding | New owner needs a clear next action. Add completion checklist and empty states. | P2 | M | WIS-012 | workspace dashboard | User can reach publish/share in ≤3 understandable steps; empty/loading/error states specified. |
| WIS-014 | Admin scalability UX | Admin tables lack proven pagination/confirmation workflows. | P2 | M | WIS-003 | admin data/UI/APIs | Search/filter/pagination works; privileged actions confirm and are audited. |

## Phase 3 — invitation experience

| ID | Task | Problem → solution | Priority | Complexity | Dependencies | Likely files/modules | Acceptance criteria |
|---|---|---|---|---|---|---|---|
| WIS-015 | Template quality matrix | Distinct concepts exist; real content/cover/mobile contrast not proven. Create per-template visual and accessibility cases. | P1 | M | WIS-010 | invitation components/assets/CSS | Every template passes contrast, long-content, no-image, reduced-motion and mobile cases. |
| WIS-016 | Animation performance contract | Keep animation premium but bounded. Define CSS/GSAP budget, skip/fallback, no auto-audio. | P2 | M | WIS-010 | `InvitationClient`, CSS | Opening is skippable, keyboard-safe, reduced-motion-safe and meets mobile budget. |
| WIS-017 | Media pipeline | MIME-only validation and DB blobs are weak at scale. Validate magic bytes/dimensions and decide object storage migration. | P1 | L | storage provider decision | cover/payment routes, storage lib, migrations | Reject invalid/oversized/pixel-bomb media; existing media remains available; migration rollback documented. |

## Phase 4 — admin & operations

| ID | Task | Problem → solution | Priority | Complexity | Dependencies | Likely files/modules | Acceptance criteria |
|---|---|---|---|---|---|---|---|
| WIS-006 | Storage/backup scale plan | Primary DB carries blobs. Measure, set retention, migrate safely if threshold reached. | P1 | L | WIS-017, backup decision | storage, DB ops, docs | Backup/restore meets target; storage costs/limits monitored; signed access policy tested. |
| WIS-008 | Privacy lifecycle | PII retention/deletion/export not operationalized. Add policy and support/admin workflow. | P1 | M | legal owner/contact | privacy route, support/admin, docs | User can request export/deletion; retention owners and exceptions documented; logs/Sentry scrubbed. |
| WIS-018 | Observability completion | Sentry wiring exists but setup success unverified. Configure alerting, release tags and PII filtering. | P1 | M | WIS-004 | Sentry configs/runbook/Vercel | Preview smoke succeeds; production errors correlate to release/request ID; no sensitive payloads. |

## Phase 5 — production hardening

| ID | Task | Problem → solution | Priority | Complexity | Dependencies | Likely files/modules | Acceptance criteria |
|---|---|---|---|---|---|---|---|
| WIS-007 | Input/media and URL hardening | Uneven field validation and unverified uploads. Add shared schemas/limits, https URL policy and abuse tests. | P1 | M | WIS-003 | request validation, routes | Invalid/malicious inputs rejected consistently; no raw errors or unsafe link schemes. |
| WIS-010 | Browser/mobile/performance baseline | No reliable production E2E/Lighthouse results. Restore browser CI and capture budgeted metrics. | P1 | M | test browser install/cache | Playwright, CI, performance scripts | Chrome/Safari/Firefox/Edge matrix passes; mobile home/invite metrics recorded and budget-gated. |
| WIS-019 | SEO/release verification | Good metadata code needs deployed proof. Verify canonical host/index policy/social previews. | P2 | S | WIS-004 | metadata/robots/sitemap | Only public platform pages indexed; invitations and private routes never indexed; previews valid. |

## Phase 6 — launch

| ID | Task | Problem → solution | Priority | Complexity | Dependencies | Likely files/modules | Acceptance criteria |
|---|---|---|---|---|---|---|---|
| WIS-020 | Controlled beta | Launch must be evidence-led. Invite small cohort, monitor auth/RSVP/payment/support. | P1 | M | All P0/P1 closure | operations/runbooks | No P0 regressions; defined support response; metrics and feedback reviewed before public launch. |
| WIS-021 | Public launch | Final release gate and rollback rehearsal. | P1 | S | WIS-020 | Vercel, docs | All checklist items checked with evidence; rollback/restore contacts reachable. |

## Prioritized backlog

### WIS-001 — Fix Google OAuth account linking
Priority: P0  
Area: Authentication  
Complexity: Medium

Description: Replace the dead-end existing-password → Google result with a provider-supported verified linking/recovery design.

Acceptance Criteria:

- New Google, existing password, existing Google and invalid/expired state cases are automated in an isolated tenant.
- No account is merged based only on a matching email.
- The UI offers a clear recovery path and localized error code.

Dependencies: Neon Auth provider capabilities and callback settings.

### WIS-002 — Enforce persisted English-first defaults
Priority: P1  
Area: Internationalization / Data  
Complexity: Medium

Description: Align schema, creation fallbacks, seed content and API errors with English-first/LTR while preserving existing Arabic data.

Acceptance Criteria:

- Fresh user/event/invitation is English by default.
- Arabic remains a deliberate persisted preference and RTL works after all route transitions.
- Migration is additive, reversible and tested.

Dependencies: WIS-003 regression suite.

### WIS-003 — Add multi-identity authorization E2E
Priority: P0  
Area: Security / QA  
Complexity: Large

Description: Prove every sensitive API/UI path denies cross-owner and role-inappropriate access. A 12 September 2026 controlled production check verified two distinct accounts, separate event context and the owner-scoped implementation, but direct `/api/*` substitution was blocked by the cloud-browser policy. The opt-in isolated Playwright suite for Owner A/B event substitution and normal-user admin denial is now operational in GitHub Actions, using a dedicated non-production Neon branch; its first successful run was [34821961307](https://github.com/Kerolos17/wisal/actions/runs/34821961307) on 14 September 2026. Extend it with guest-token and role-matrix cases before closing the release gate.

Acceptance Criteria:

- Owner A/B, role matrix and guest token cases execute in CI.
- UUID/token substitution returns no PII and correct status.
- Tests use non-production data and clean up safely.

Dependencies: isolated auth/database fixtures.

### WIS-004 — Verify production identity configuration
Priority: P0  
Area: DevOps / Security  
Complexity: Medium

Description: Verify Vercel/Neon runtime secrets, domain callbacks, cookie policy and reset delivery without exposing values.

Acceptance Criteria:

- A dated release record proves all required settings and callback origins.
- Preview and production cannot cross-use secrets or callbacks.
- Session/reset/logout behavior is verified end-to-end.

Dependencies: Vercel and Neon administrative access.

### WIS-005 — Make delivery truthful and build provider boundary
Priority: P1  
Area: Messaging  
Complexity: Large

Description: Keep the current manual WhatsApp queue truthful; introduce delivery only through a designed provider adapter.

Acceptance Criteria:

- No UI calls a saved/scheduled message “sent” unless provider success exists.
- Provider architecture has consent, idempotency, per-recipient status, retry/DLQ and audit.

Dependencies: provider selection and privacy policy.

### WIS-006 — Separate media scale from primary database
Priority: P1  
Area: Data / DevOps  
Complexity: Large

Description: Plan safe object storage and retention for covers/receipts while retaining existing objects.

Acceptance Criteria:

- Storage/backup growth is measured and thresholded.
- Migration has integrity check, rollback and access-control tests.

Dependencies: WIS-017 and storage provider decision.

### WIS-007 — Harden validation and uploads
Priority: P1  
Area: Security  
Complexity: Medium

Description: Apply shared allowlists/length limits, URL validation, magic-byte and dimension validation.

Acceptance Criteria:

- Invalid input/media produces localized safe errors.
- Regression/security tests cover oversize, spoofed MIME and unsafe URLs.

Dependencies: WIS-003.

### WIS-008 — Operationalize privacy
Priority: P1  
Area: Privacy / Operations  
Complexity: Medium

Description: Establish retention, deletion/export, PII redaction and support ownership.

Acceptance Criteria:

- Published policy matches product behavior.
- Deletion/export process is tested with audit evidence.

Dependencies: legal/business contact decision.

### WIS-009 — Modularize dashboard/studio UI
Priority: P1  
Area: Frontend architecture  
Complexity: Large

Description: Gradually decompose the oversized page/CSS into feature modules and primitives.

Acceptance Criteria:

- No change to public contracts, navigation, or visual output without approved evidence.
- Bundle and focused test baselines do not regress.

Dependencies: visual regression baseline.

### WIS-010 — Establish mobile/browser/performance release gates
Priority: P1  
Area: QA / Performance  
Complexity: Medium

Description: Make real device/browser smoke and performance checks repeatable in CI and release review.

Acceptance Criteria:

- Playwright browsers are installed/cached in CI.
- Required browser/width matrix and Core Web Vitals budgets produce artifacts.

Dependencies: CI environment update.

### WIS-011 to WIS-021

Priorities, dependencies and acceptance criteria are defined in the phase tables above. Implement in numerical/phase order unless an approved production incident requires a smaller safe deviation.

# Wisal — Master Product Audit, Competitor Analysis & Launch Roadmap

**Audit date:** 24 September 2026 (full refresh; supersedes the 2 September 2026 audit, scored 63/100)
**Repository:** `E:\wisal`, branch `main`
**Production reviewed:** [wisal-self.vercel.app](https://wisal-self.vercel.app) (home + `/api/health`, read-only; no auth credentials provided)
**Audit posture:** Evidence-led. Code and config inspected directly; verification commands executed locally; live site probed read-only. Authenticated workspace/admin, real RSVP submission, real payment transfer, and production secret values are **NOT VERIFIED** (no test accounts provided) — marked as such, never assumed.
**Market focus:** Egypt first; Arabic-speaking MENA second.

---

## 0. Launch Readiness Dashboard (read this first)

```text
Overall Launch Readiness: 70/100

Core Product:      12/15
UX / Conversion:    7/10
UI / Brand:         7/8
Mobile:             8/8
Security/Privacy:  10/15
Reliability/Data:   7/10
Performance:        6/8
QA:                 4/7
DevOps:             3/5
SEO / Sharing:      3/4
Analytics/Obs:      2/4
Competitive:        3/6

P0 Issues: 0 open (SEC-001 closed Phase 0)
P1 Issues: 11 open (MOBILE-001 closed Phase 7; RSVP-001/FLOW-001 harnesses merged, isolated runs pending)
P2 Issues: 11
P3 Issues: 4

Launch Verdict: 🟡 BETA READY — controlled beta only; paid public launch is a no-go until P0+P1 gates close.

Top 5 Launch Blockers:
1. SEC-001 — Next.js 16.3.0 ships a CRITICAL unauthenticated RCE (Image Optimization/AVIF). Upgrade to >=16.3.3.
2. QA-001 — 2/179 contract tests FAIL on the working tree (uncommitted atelier rework removed per-stage attendance strings).
3. RSVP-001 — RSVP integrity looks fixed in code (transaction + row lock + 409 conflict) but has zero runtime proof.
4. PAY-001 — manual-payment production acceptance incomplete (accounts, dual review, refund/tax wording, staging+prod evidence).
5. OPS-001 — Sentry + structured logging landed, but no proven alert path; no funnel telemetry.

Top 5 Competitive Opportunities:
1. Per-segment invitations + per-stage RSVP (no direct Egypt competitor demonstrates this).
2. Self-service in minutes vs designer-made 2–4 day turnaround (Zeekraa) — make speed explicit.
3. Honest catalog: DB-driven prices with snapshot enforcement (competitors lean on discount framing).
4. Owner-initiated WhatsApp personal links with scoped segments (privacy story competitors don't tell).
5. Preview-before-signup gallery of real invitation worlds (already partially built; finish it).
```

### Score history

| Date | Score | Verdict | Delta driver |
|---|---|---|---|
| 2 Sept 2026 | 63/100 | 🟡 Beta | baseline |
| 24 Sept 2026 | 66/100 | 🟡 Beta | privacy/SEO hardening, RSVP transaction, catalog alignment, Sentry/logging (+); critical dep RCE, 2 failing tests (−) |
| 24 Sept 2026 (Phase 7) | 70/100 | 🟡 Beta | dep RCE closed, tests 196/196, mobile widths verified, hydration #418 fixed, hero proven WebP/13KB (+); manual gates unchanged (−) |

---

## 1. Executive Summary

Wisal remains a credible, unusually polished beta. Since the September audit the team closed real gaps: invitation routes are now `noindex` with self-canonical metadata (`app/robots.ts`, `app/sitemap.ts`, `app/invite/[slug]/page.tsx`, `next.config.ts` headers), the RSVP write path is transactional with an event row lock and name-conflict 409s (`lib/wisal-data.ts:533-612`), catalog prices are DB-driven with snapshot enforcement and a graceful "unavailable" fallback instead of disagreeing hardcoded prices, and observability foundations (Sentry baseline, structured redacting logger, preview-only smoke endpoint) landed.

Three things prevent a higher score: (1) a **new P0** — the installed Next.js 16.3.0 carries a critical unauthenticated RCE fixed in 16.3.3; (2) **uncommitted atelier rework** (`app/page.tsx`, `app/layout.tsx`, `app/invite/[slug]/InvitationClient.tsx`, `DESIGN.md`, new `app/invite/preview/`, `app/wisal-atelier.css`) breaks 2 regression tests and ships unreviewed; (3) the same runtime-evidence gaps as September — no proven E2E (signup→publish→RSVP), payment acceptance, alert path, or backup-restore drill evidence re-verified this round.

Recommendation: a short hardening program (dependency upgrade → reconcile working tree → runtime proof → payment/legal/domain gates), not a redesign or feature spree.

---

## 2. Current Product Snapshot

**Fact.** Next.js 16.3.0 + React 19, Tailwind 4, Drizzle ORM on Neon Serverless Postgres, Neon Auth (`WISAL_AUTH_PROVIDER=neon`), Vercel (`fra1`), Sentry 10.46.0, self-hosted fonts (IBM Plex Sans Arabic, Noto Naskh Arabic, Manrope, Cormorant Garamond). Media stored as bytea blobs in Postgres (`media_blobs` via `lib/wisal-storage.ts`), not object storage. No transactional email provider (intentional), no automated WhatsApp sending (owner-initiated sharing only), manual transfer-receipt payments (InstaPay, Vodafone/Orange/Etisalat Cash, bank transfer).

**Fact.** 12 invitation concepts registered (`lib/invitation-concepts.ts`): love-poem, garden-night, moonlight, golden-vows, white-story, cinema-night, rose-garden, cathedral-light, desert-sunset, velvet-night, coastal-breeze, modern-monogram. Landing gallery surfaces 6. Seed catalog: 12 templates, 3 plans (starter 199 / elegant 599 / signature 1699 EGP), platform content keys.

**Fact.** Working tree is dirty: 4 modified files + 4 untracked paths (atelier landing rework, `InvitationClient` preview mode + music/UX copy tweaks, layout CSS import). Production still serves the pre-rework landing ("Every guest. In perfect orbit.") — confirmed via live fetch 24 Sept.

---

## 3. System Architecture

```text
Guests (mobile-first, WhatsApp links)
  ↓  /invite/[slug]?g=<inviteToken>  (public, rate-limited, noindex)
Couples / Admins (browser, AR/EN, RTL/LTR)
  ↓  Next.js 16 App Router (RSC pages + client components, single app/page.tsx shell)
  ↓  Route Handlers (/api/*) + Server Actions  ·  proxy.ts (Neon Auth middleware, /auth/callback only)
  ↓  lib/ (wisal-data, payments, admin-auth, public-api-guard, wisal-storage, logger, site-url)
  ↓  Neon Auth (session) + Neon Serverless Postgres (Drizzle)
  ↓  media_blobs (bytea) · rate_limit_windows (shared limiter, fail-closed 503)
  ↓  External: Vercel hosting (fra1) · Sentry (error monitoring) · manual payment rails (human-reviewed)
  ✗  No email provider · No WhatsApp Business API · No object storage · No analytics pipeline
```

**Observation.** The architecture is a coherent monolith with clear layering. Authorization is consistently owner-scoped (`getCurrentOwnerEmail()` → `events.owner_id` checks; admin routes gated by `forbiddenUnless(permission)`). Public mutation routes share a hardened guard (JSON-only, body cap 16KB, same-origin check, shared rate limit). Weakest structural points: media blobs in Postgres (works at beta scale, becomes a cost/perf liability), rate-limit state sharing the primary DB, and auth middleware covering only `/auth/callback` (page protection relies on server-component identity checks — verify coverage per route in TASK-006).

---

## 4. Feature Inventory

| Module | Status | Evidence |
|---|---|---|
| Public landing (bilingual, templates, pricing) | Mostly complete | `app/page.tsx` Landing; live site renders full narrative + gallery + pricing |
| Auth (signup/login/OAuth/recovery) | Partially implemented / NOT VERIFIED runtime | Neon Auth integration present; production behavior unverified, no test account |
| Invitation builder (5-step studio) | Mostly complete | `app/page.tsx` studio flow; contract tests pass |
| Templates (12 concepts) | Mostly complete | `lib/invitation-concepts.ts`, seed, preview route `app/invite/preview/[concept]` |
| Public invitation + opening styles | Mostly complete | `InvitationClient.tsx` (envelope/card/curtain; classic/story/cinematic) |
| Per-segment access + per-stage RSVP | Complete (code) / NOT VERIFIED runtime | `saveRsvp` transaction, `guestSegmentAccess`, `segmentRsvps` |
| Guest management + groups + CSV (500 cap) | Mostly complete | routes + `ImportGuestsModal`; runtime CSV round-trip unverified |
| Personal links + WhatsApp sharing | Mostly complete | invite tokens, `trackInvitationOpen`; delivery is owner-initiated |
| User dashboard (events, attendance, messages) | Mostly complete | `app/page.tsx` Dashboard; per-stage stats strings currently broken on working tree (QA-001) |
| Admin (users, templates, plans, content, support, payments) | Partially implemented / NOT VERIFIED runtime | `app/api/admin/*` + `lib/admin-auth.ts` role matrix; no admin runtime proof |
| Manual payments (request → receipt → approve/reject) | Partially implemented | `lib/payments.ts` (501 lines) with snapshot + idempotency guards; production acceptance incomplete |
| Media upload (cover, JPG/PNG/WebP, 5MB) | Complete (code) | `app/api/events/[id]/cover/route.ts:8-21`; runtime upload unverified |
| Support tickets + notifications | Mostly complete | routes + `AccountCenter`; delivery paths unverified |
| i18n AR/EN + RTL/LTR + persistence | Mostly complete | `use-wisal-locale.ts` (localStorage `wisal-locale-v3`, `document.lang/dir`) |
| Analytics / monitoring | Prototype | Sentry + structured logger landed; no funnel events, no proven alerts |
| Email / automated WhatsApp | Missing (intentional) | documented in `docs/LAUNCH_READINESS.md` |

---

## 5. User Journey Analysis

### Visitor → Signup
Landing explains the product well (hero → how-it-works → gallery → segments → pricing → FAQ pattern observed live). Friction: long narrative before the first action; "Preview first — sign in when ready" assurance exists only in the **uncommitted** rework, not production. Trust gap persists (no demos with real names, no testimonials — correctly not fabricated; use illustrative examples labeled as such, as production already does).

### New user → Publish → Share
Five-step studio (template → story → signature → RSVP → publish) is clear in code. **NOT VERIFIED** end-to-end (no account). Risk: `chooseEvent`/publish error paths and loading states need runtime confirmation (FLOW-001).

### Guest → Open → RSVP
Strong design: scoped segments, per-stage responses, personalized vs anonymous paths, deadline + access-mode enforcement server-side. **NOT VERIFIED** runtime. Prior overwrite-by-name vector appears closed in code (INSERT with fresh UUID; unique `(event_id, name)` → 409 `RSVP_NAME_CONFLICT`; personalized path UPDATEs gated by `invite_token`). Needs two-account/browser proof (TASK-003).

### Returning user → Manage
Dashboard covers events, guests, attendance, messages, notifications, support. The working-tree rework removed attendance strings → regression failure; reconcile before any demo (QA-001).

### Admin
Role matrix (`admin`, `support`, `content_manager`, `couple`) with per-permission gating is sound in code. Entire workflow **NOT VERIFIED** (no admin session). Payment dual-review is documented as single reviewer currently — process gap (PAY-001).

---

## 6. UI Audit

**Observation.** Coherent atelier direction (lilac/porcelain/aubergine/chartreuse, self-hosted type pairing, invitation-as-hero). The uncommitted rework pushes this further (interactive preview, selectable design swatches, "atelier" naming replacing "Product/Templates" nav with "How it works/Designs"). Risk: two visual languages now exist — deployed "atlas" vs working-tree "atelier" — and the tree is the one breaking tests. Decide, reconcile, then ship one (TASK-002).

Findings: UI-001 (P2) nav/copy drift between tree and production; UI-002 (P3) template gallery shows 6 of 12 concepts with no path to the other six.

---

## 7. UX Audit

Strengths: preview-before-signup direction, scoped guest links, per-stage RSVP, graceful catalog-unavailable state. Gaps: UX-001 (P2) no guest-facing "what happens after I RSVP" confirmation beyond thank-you copy (no calendar/share nudge verification at runtime); UX-002 (P2) checkout copy frames plans as "N-day subscription" for a one-event purchase — reframe as event access; UX-003 (P3) message scheduling/delivery status is owner-opaque until runtime-tested.

---

## 8. Mobile Audit

Prior audit found no overflow at 320–1440px and touch-safe controls (code unchanged in relevant layout paths except landing hero). The new atelier hero uses `fill` imagery + overlay buttons — must re-verify 320–430px for overlap/overflow before merge (MOBILE-001, P1, part of TASK-002). Guest invitation remains the launch-critical surface; its component logic is unchanged and bilingual copy complete.

---

## 9. Invitation Experience Audit

`InvitationClient.tsx` covers: private/public greeting, opening interaction, program/segments with scoped visibility note, countdown, schedule, map link, per-stage RSVP, meal preference, save-the-date (ICS), share/copy, music toggle, privacy reassurance. Copy is complete in both languages. Uncommitted diff adds `previewMode` prop (gallery reuse — good) and removes the `⌁` glyph from privacy lines (cosmetic). Open question for runtime: audio autoplay policies, ICS on iOS, image weight of cover + gallery on slow 4G (PERF-001).

Template differentiation: 12 named concepts with distinct art direction in the gallery; the underlying renderer maps names → concepts with a `love-poem` default (`resolveInvitationConcept`). Verify each of the 12 renders distinctly, not just the showcased 6 (TASK-008, P2).

---

## 10. Accessibility Audit

Present: semantic landmarks observed in code (`nav aria-label`, `aria-pressed` swatches, `role="status/alert"` catalog states, focus-visible locale switch, reduced-motion handling per prior audit + tests). Gaps: A11Y-001 (P2) full keyboard/contrast pass on the **new** atelier hero and preview-mode invitation never done; A11Y-002 (P3) assistive-technology testing remains NOT VERIFIED (no device lab claimed).

---

## 11. Internationalization Audit

Solid foundation: `use-wisal-locale.ts` (default `en`, versioned `wisal-locale-v3` key, sets `document.lang` + `dir`), direction-aware CSS (`[dir="ltr"]` overrides asserted in tests), complete AR/EN invitation copy, bilingual legal pages, localized validation/error messages. Gaps: I18N-001 (P2) date/number formatting (Arabic-Indic digits used in places, ISO elsewhere — standardize per locale); I18N-002 (P3) no URL-based locale (query-param only, unshared links revert) — acceptable for MVP, revisit post-launch.

---

## 12. Security Audit

| # | Severity | Finding | Evidence | Status |
|---|---|---|---|---|
| SEC-001 | **P0** | Next.js 16.3.0 vulnerable to unauthenticated RCE via Image Optimization with AVIF (GHSA-2xp9-vwfh-vxw4; fixed in ≥16.3.3) | `package.json:32` (`"next": "16.3.0"`); `npm audit` → `critical \| next` | OPEN — upgrade first |
| SEC-002 | P1 | `fast-uri` high (host confusion, GHSA-jqff) — repo `overrides` pins 3.1.5, fix needs ≥3.1.6; `sharp` high (libheif) via Next/sharp chain | `package.json:36-38`; `npm audit` (19 vulns: 1 critical, 5 high, 12 mod, 1 low) | OPEN |
| SEC-003 | P1 | `proxy.ts` matcher covers only `/auth/callback`; page-level protection depends on server-component identity checks per route | `proxy.ts:10-12` | Review (TASK-006) |
| — | — | No tracked secrets; `.env` uncommitted; `git grep` for key patterns clean | verified 24 Sept | CLOSED |
| — | — | Upload validation (type allowlist, 5MB cap, extension derived from MIME, random UUID keys) | `cover/route.ts:8-25` | CLOSED (code) |
| — | — | Media GET restricted to `covers/<uuid>/<uuid>.(jpg\|png\|webp)` | `media/[...key]/route.ts:10-13` | CLOSED (code) |
| — | — | Public guards: JSON-only, 16KB cap, same-origin, shared rate limit fail-closed 503 | `public-api-guard.ts:60-84` | CLOSED (code) |
| — | — | Security headers + CSP (no `unsafe-eval` in prod), invite `noindex` headers + `no-referrer` | `next.config.ts:32-55` | CLOSED |

Serving user uploads from the same origin with `immutable` caching is fine; note `img-src 'self' data: blob:` permits data-URI images — acceptable for this product, no change recommended.

---

## 13. Authentication & Authorization

Neon Auth session → `getPlatformIdentity()` → `getCurrentOwnerEmail()`; owner scoping enforced in data layer (`events.owner_id`), admin by role matrix with `forbiddenUnless`. Safe return-path handling (`safeReturnPath` blocks `//` open redirects). First-admin bootstrap via `PLATFORM_OWNER_EMAIL` (no hardcoded emails). Cookie secret length enforced (≥32 chars).

AUTH-001 (P1): signup/login/OAuth/recovery/delivery lack production acceptance evidence — unchanged, NOT VERIFIED. Also note the non-Neon fallback path (`getChatGPTUser`) — confirm it cannot activate in production via env review (TASK-006).

---

## 14. Database & Data Integrity

Schema (`db/schema.ts`, 394 lines) is well-constrained: FK cascades from `events`, unique `(event_id, name)` + unique `invite_token` on guests, one-membership-per-guest, single-audience check on segment access, capacity-safe RSVP transaction with `SELECT ... FOR UPDATE` on the event row. `db:verify` passes (6 migrations + 1 seed). Restore-drill evidence committed since September (docs) — retention schedule and re-verification this round remain NOT VERIFIED (REL-001, P1).

Watch items: `enabled_locales` jsonb default is mutable-shared (minor, P3); media blobs in Postgres will need an object-storage migration path past beta scale (P3, do not build now).

---

## 15. Code Quality

Single-file `app/page.tsx` shell (~1300+ lines) remains the main maintainability drag, but it is **working and tested by contract tests** — do not rewrite (Rule 4). `tsc --noEmit` passes on the dirty tree. Payment domain is well-factored (`payments.ts` + error-status mapper + redacted audit logs). Logger redacts PII/token keys. Dead-code/outdated-dep sweep is P3; dependency upgrades are P0/P1 for security only.

---

## 16. Performance

No new measurements taken this round (no perf harness credentials/device lab). Prior throttled trace: TTFB 307ms, FCP 2.72s, **LCP 6.64s (poor)**, CLS 0, ~398KB transfer. PERF-001 (P1) carries over, extended: the atelier hero adds full-bleed raster (`porcelain-invitation-on-lilac-silk.png`) — budget, compress, and re-measure before merge (TASK-002 acceptance includes LCP/CLS budgets).

---

## 17. SEO & Social Sharing

Fixed since September: `robots.ts` disallows `/admin`, `/workspace`, `/api/`, `/invite/`; invite routes emit `noindex, nofollow, noimageindex` + `no-referrer`; invite metadata is `index:false` with self-canonical and empty OG images; sitemap lists only `/`, `/privacy`, `/terms`; layout has canonical + OG/Twitter + JSON-LD. SEO-001 (P2, opportunity): invitation OG images are empty, so WhatsApp/Telegram link previews are generic — design a privacy-safe preview (couple names + date on a branded card, no guest data) as a V1.1 growth lever. `metadataBase` still defaults to `wisal-self.vercel.app` until the final domain lands (DOM-001).

---

## 18. Email & Communication

Unchanged by design: no email provider, no automated WhatsApp. Owner-initiated sharing via personal links; per-audience recipient counts computed live before saving. EMAIL-001 (P1, process): keep all email promises out of copy until a monitored sender domain + DNS + delivery verification exist (`docs/LAUNCH_READINESS.md` already gates this — enforce in review).

---

## 19. QA & Testing

**Fact (24 Sept, dirty tree): 177/179 pass, 2 fail** — both assert `app/page.tsx` strings removed by the uncommitted rework (`Attendance by stage`, `الحضور حسب المرحلة`). `db:verify` passes. `tsc` passes. `npm run lint` could not complete locally (timeout) — treat as NOT VERIFIED, re-run in CI. Payment DB tests are opt-in (`PAYMENT_TEST_MODE`, isolated URL — correct design). Playwright config + public smoke suite exist; critical journeys still lack real browser+DB proof (QA-002, P1).

---

## 20. DevOps

Vercel `main` → production, `fra1`; `/api/health` returns `ok` (app + DB) — verified live 24 Sept. Safety-gated migrations (`db:migrate` gate; fresh-history verify). CI history was green in September (not re-pulled this round — re-check in TASK-001). Open: final-domain cutover (metadataBase, robots/sitemap, auth callbacks), production env review, payment ops runbook (DOM-001/PAY-001, P1).

---

## 21. Monitoring

Improved: Sentry 10.46 + `instrumentation*.ts` + preview-only `ops/sentry-smoke` (token-gated) + structured redacting logger with request IDs. OPS-001 (P1): trigger one synthetic failure in preview and confirm the alert reaches a human; define uptime checks. No product-funnel telemetry (ANALYTICS-001, P2 — Section 22 events).

---

## 22. Analytics

No product analytics verified. Recommended events (implement post-gates, P2): `landing_view, signup_started, signup_completed, invitation_created, template_selected, invitation_published, invitation_shared, invitation_opened, rsvp_started, rsvp_completed`. Funnel: Visitor → Signup → Created → Published → Shared → Opened → RSVP. Prioritize `invitation_opened` + `rsvp_completed` (they prove the core loop).

---

## 23. Competitor Landscape (researched 24 Sept 2026; prices as listed on vendor sites, may change)

**Egypt / MENA direct:**
- **Invitou** (invitou.com) — Arabic-first invitation websites, RSVP add-on, guest tracking, attendance reports. Launch pricing **299 / 499 / 799 EGP** (struck-through 499/799/1299). Closest direct competitor.
- **Zeekraa** (zeekraa.com) — luxury designer-made invitations, **800–1000 EGP** + add-ons (RSVP +300, bilingual +400, venue video +500); 2–4 day turnaround; custom from scratch. Competes on craft, not speed.
- **Faraha** (faraha.app) — wedding websites from **1200 EGP**, tiers to **3000 EGP/90 days** (1000 guests, custom domain, analytics). Website-builder positioning.
- **To.Wedding** — romantic templates, custom link (`To.Wedding/your-names`), dashboard + greetings, map, **~300 EGP** promo. Conversion via 24h sales call (high-touch, low automation).
- **fr7y | فرحي** (fr7y.com) — luxury Arabic self-service, under-5-minutes creation, WhatsApp sharing, per-design motion/typography. Strongest UX benchmark regionally.
- **فرحنا** (rakancreative) — no-signup instant builder, guest photo uploads, song on invite page. Lowest-friction onboarding seen.

**Global / indirect:**
- **QuikRSVP** — free (3 forms/yr, 25 responses), **$35/$75 per form**; 70+ AI languages, WhatsApp/SMS bulk messaging with credits, seating, QR check-in.
- **AreOne** — free 7-day trial (30 guests); **$44 one-time Event Pass** (unlimited guests, seating, analytics); wedding website $12/mo. One-time pricing validates Wisal's non-subscription instinct.
- **Invitos.me** — **$69.99 one-time/3 months**, QR check-in, Excel export, real-time analytics.
- **Fotify** — free 20 invites; **$49.99 premium** (unlimited, seating, QR, live photo sharing, DJ requests).
- **Izzan** (UAE/GCC) — free to 20 guests; WhatsApp reminders, Arabic templates, 24/7 AR support. Regional playbook reference.
- **Indirect:** Canva templates (DIY, no RSVP loop), WhatsApp designers (manual, no tracking), wedding planners (service, not software).

---

## 24. Competitor Matrix

| Competitor | Market | Pricing | Templates | RSVP | Guest mgmt | Custom domain/link | Arabic | Mobile UX | Animations | Sharing | Analytics | Differentiator |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Wisal | EG/MENA | 199/599/1699 EGP | 12 concepts | Per-stage | Groups+segments+CSV | Slug links | Native RTL | Strong | Openings | Personal WhatsApp links | Per-stage | Segment-scoped invitations |
| Invitou | EG/MENA | 299/499/799 EGP | Hand-crafted | Add-on | Tracking+reports | Custom URL | Native RTL | Strong | Yes | Link | Attendance | Closest feature parity |
| Zeekraa | EG | 800–1000+ EGP | Designer-made | +300 add-on | Guest list | — | AR | Strong | Cinematic | Link | — | Bespoke craft, music |
| Faraha | EG/MENA | 1200–3000 EGP | Website themes | Yes | RSVP mgmt | Custom domain | AR/EN | Good | Yes | Link | Advanced | Full wedding website |
| To.Wedding | EG | ~300 EGP | 10+ romantic | Basic | Dashboard+greetings | Custom link | AR | Good | Romantic | Link | Basic | Price + sales call |
| fr7y | MENA | NOT VERIFIED | Luxury set | Yes | Tracking | Personal link | Native | Excellent | Per-design | WhatsApp/email | Live | Self-service luxury |
| QuikRSVP | Global | $0/$35/$75 | Functional | Deep | Messaging+seating+QR | Custom link | 70+ langs | Good | Envelope | WA/mail/SMS | Real-time | Messaging credits + seating |
| AreOne | Global | $44 once | 75+ | Built-in | Seating/meals/CSV | Add-on link | RTL incl. AR | Good | Standard | WA/QR | Live | One-time price clarity |

---

## 25. Competitive Gap Analysis

**A. They have — we do not:** QR check-in (Invitos, QuikRSVP, Fotify); seating planner (QuikRSVP, AreOne); guest photo uploads/live gallery (Fotify, فرحنا); custom domains (Faraha); automated reminders/messaging credits (QuikRSVP, Izzan); guest song/music choice (Zeekraa standard!); free trial tier (all global players); money-back guarantee (QuikRSVP 7-day).
**B. We have — they do not:** per-segment visibility + per-stage RSVP in one link; segment-scoped personal tokens; DB-enforced catalog/price snapshots; transaction-safe anonymous RSVP with conflict semantics; manual-transfer payments native to Egypt (InstaPay, Vodafone/Orange/Etisalat Cash).
**C. Both have:** bilingual AR/EN, templates, countdown/maps/music, WhatsApp sharing, guest counts, CSV import/export.
**D. Neither solves well:** post-wedding value (memory site, thank-yous); plus-one/family modeling; Arabic date/typography finesse; honest "what will my guests see" preview for every segment.

---

## 26. Product Differentiation

Validated differentiators (do not copy blindly): **segment-scoped invitations** (see only your moments, reply per moment) — genuinely unique in the surveyed set; **self-service in minutes with Egyptian payment rails** — versus Zeekraa's 2–4 days and To.Wedding's sales call; **privacy-forward personal links** (noindex by default, token-gated private mode). Weak claims to avoid: "premium design" alone (Zeekraa/fr7y outgun on craft perception), "all-in-one" (Faraha owns website-builder framing).

---

## 27. Monetization

Current: starter 199 / elegant 599 / signature 1699 EGP, enforced via DB prices + `priceEgpSnapshot` on requests + amount-match on submission — sound mechanics. Two concerns: (a) checkout copy says "N-day subscription" — for a one-event purchase this framing invites refund disputes; reframe as event access with a clear validity window (UX-002, P2); (b) no free/trial tier while every global competitor and فرحنا offer one — a watermarked preview already exists directionally (uncommitted "preview first" assurance); productize it (V1.1). Keep one-time/event pricing; do not force SaaS subscriptions.

---

## 28. Conversion & Trust

Blockers: no real demos beyond illustrative couple (acceptable — label them); pricing page shows loader/unavailable states honestly (good); refund/tax/invoice language missing (PAY-001); support responsiveness unproven; terms/privacy exist bilingually but await counsel review (LEGAL-001). Quick wins: publish the preview gallery (6→12 designs), add "how sharing works" strip, show plan validity plainly.

---

## 29. Privacy / Legal Readiness

Privacy + Terms exist in AR/EN and are linked from marketing and invitation surfaces. Invitations default to non-indexable; private mode requires tokens; logs redact PII. Still required (P1, counsel review, not legal advice): privacy policy + terms + retention + guest-data consent + photo rights + tax/invoice wording + account/data-deletion flows + refund policy. Mark each as requiring actual legal review.

---

## 30. Launch Readiness Score (detail)

| Category | Wt | Score | Evidence | Required improvement |
|---|---|---|---|---|
| Core Product | 15 | 12 | 12 concepts, studio, segments, RSVP, guests, payments in code; runtime unverified | E2E proof (TASK-003/004) |
| UX/Conversion | 10 | 7 | Clear narrative; trust + subscription-framing gaps | Reframe plans; preview gallery |
| UI/Brand | 8 | 7 | Coherent atelier system; tree/prod drift | Reconcile atelier (TASK-002) |
| Mobile | 8 | 8 | Phase 7: 0 overflow at 320–1440, targets ≥53px, screenshots verified (landing + preview) | throttled field re-trace V1.1 |
| Security | 15 | 10 | Headers, guards, scoping, uploads solid; **P0 dep RCE** | Upgrade Next ≥16.3.3 (TASK-001) |
| Reliability | 10 | 7 | Transactions, verify-gate, drill docs; retention/schedule open | Backup runbook (TASK-005) |
| Performance | 8 | 6 | Phase 7 lab: LCP 212–1100ms landing / 476–656ms preview, CLS 0; hero 750w served WebP 13KB via next/image | throttled 4G field trace V1.1 |
| QA | 7 | 4 | 196/196; hydration #418 fixed + regression tests; E2E harnesses merged, isolated runs pending | isolated DB evidence (TASK-003/004) |
| DevOps | 5 | 3 | Health ok, gated migrations; domain/env open | Cutover checklist (TASK-007) |
| SEO/Sharing | 4 | 3 | noindex/canonical/sitemap correct | Preview cards V1.1 |
| Analytics | 4 | 2 | Sentry+logger; no funnel | Alert proof + events (TASK-005/009) |
| Competitive | 6 | 3 | Unique segments; crowded low-price field | Speed + privacy positioning |
| **Total** | **100** | **70** | **🟡 Beta candidate** | manual gates below |

---

## 31. Complete Findings Register

### P0 — Critical (block paid launch; fix immediately)

| ID | Finding | Evidence | Required fix |
|---|---|---|---|
| SEC-001 | Next.js 16.3.0 has critical unauthenticated RCE in Image Optimization (AVIF), GHSA-2xp9-vwfh-vxw4; fix ≥16.3.3 | `package.json:32`; `npm audit --omit=dev` → `critical \| next` (19 total: 1 crit, 5 high, 12 mod, 1 low) | TASK-001 |

### P1 — High (required before paid launch)

| ID | Finding | Evidence |
|---|---|---|
| QA-001 | 2/179 contract tests fail on working tree (`Attendance by stage`, `الحضور حسب المرحلة` removed from `app/page.tsx` by uncommitted atelier rework) | `npm test` 24 Sept: `not ok 62, 98`; `git status` dirty |
| SEC-002 | High deps: `fast-uri` host confusion (override pins 3.1.5 < fixed 3.1.6), `sharp`/libheif, `browserslist`; dev-only `playwright` | `npm audit` output 24 Sept |
| RSVP-001 | RSVP integrity code looks correct (transaction + `FOR UPDATE` + token-gated UPDATE + 409 conflict) but zero runtime proof | `lib/wisal-data.ts:533-612`; no test accounts |
| FLOW-001 | Signup→create→publish→share→RSVP never exercised against a real DB with two independent accounts | Playwright smoke exists; journey coverage NOT VERIFIED |
| PAY-001 | Manual-payment production acceptance incomplete: receiving destinations, dual review (currently single reviewer attested), rejection/resubmission, expiry, refund/invoice/tax wording | `lib/payments.ts`; `docs/PAYMENT_PRODUCTION_ACCEPTANCE.md`; BETA gate §8 |
| AUTH-001 | Signup/login/OAuth/recovery/delivery lack production acceptance evidence | code present (`lib/auth/*`, `app/auth/*`); runtime NOT VERIFIED |
| OPS-001 | Sentry + structured logging installed, but no proven alert path (no synthetic-failure drill evidence this round) | `instrumentation*.ts`, `app/api/ops/sentry-smoke/route.ts`, `lib/logger.ts` |
| REL-001 | Backup retention schedule + re-verified restore evidence outstanding (prior drill docs exist, not re-verified) | `docs/release/*`; BETA gate operating limits |
| PERF-001 | PARTIALLY MITIGATED (Phase 7): lab LCP 212–1100ms, CLS 0; hero 750w → WebP 13KB via next/image (1.8MB source never guest-facing). Throttled field trace still open for V1.1 | phase7-shots/results.json; `public/brand/atelier/*` |
| HYDR-001 | FIXED (Phase 7): preview/invite countdown + deadline rendered server-time causing React #418 on every guest open; mount-gated with regression tests | `InvitationClient.tsx` mounted gate; `tests/invitation-hydration.test.mjs`; 0 console errors re-measured |
| DOM-001 | Final-domain cutover pending: `metadataBase`/robots/sitemap default to `wisal-self.vercel.app`, auth callback URLs | `lib/site-url.ts:1`; `docs/LAUNCH_READINESS.md` |
| LEGAL-001 | Counsel review pending: privacy, terms, retention, guest consent, photo rights, tax/invoice, deletion, refunds | `app/privacy`, `app/terms`; BETA gate §5 |
| MOBILE-001 | CLOSED (Phase 7): 0 overflow at 320/360/375/390/414/768/1024/1440, CTA/swatch targets 53–60px, landing + preview screenshots verified | phase7-shots/*.png + results.json |

### P2 — Medium (V1.1 unless cheap)

SEO-001 privacy-safe OG preview cards for invites · ANALYTICS-001 funnel events (Section 22) · UX-002 reframe "subscription" as event access · I18N-001 standardize date/number per locale · A11Y-001 keyboard/contrast pass on new hero + preview mode · TPL-001 verify all 12 concepts render distinctly · DASH-001 dashboard empty/error/loading states runtime pass · MSG-001 message scheduling/delivery transparency · EMAIL-001 keep email promises gated · SEC-003 confirm `proxy.ts` matcher vs per-route identity coverage · FLOW-002 trial/preview tier productization.

### P3 — Low / future

Custom domains per invitation · QR check-in · seating planner · guest photo uploads · AI translation (70+ langs overkill for MVP) · object-storage migration for media · `enabled_locales` mutable-default cleanup · native app (explicitly not recommended) · microservices (explicitly not recommended).

---

## 32. MVP Definition (first commercial launch)

Single published invitation from 12 templates → personal + anonymous RSVP with deadlines → guest groups/segments/CSV → open/response tracking → WhatsApp personal-link sharing → manual Egyptian-rail payments with review → bilingual AR/EN RTL/LTR → noindex-by-default invitations → health endpoint + Sentry alerts + backup runbook → domain + legal + refund policy live. Nothing else is required.

## 33. Prioritized Roadmap

- **Phase 0 — Emergency:** TASK-001 (Next upgrade + dep fixes). Nothing else ships before it.
- **Phase 1 — Foundation:** TASK-002 (reconcile atelier tree, green tests, perf budgets), TASK-006 (auth surface review).
- **Phase 2 — Core journey proof:** TASK-003 (RSVP integrity E2E), TASK-004 (owner journey E2E + CSV + upload).
- **Phase 3 — Invitation experience:** TASK-008 (12-concept distinctness + mobile guest UX).
- **Phase 4 — Dashboard:** covered in TASK-004/008 acceptances.
- **Phase 5 — Admin & ops:** TASK-005 (monitoring/alerts + backup runbook), TASK-007 (domain cutover + payment acceptance + legal).
- **Phase 6 — Hardening:** TASK-006 (rate-limit/load review, ChatGPT-fallback env check).
- **Phase 7 — Performance:** budgets enforced in TASK-002; full trace in V1.1.
- **Phase 8 — Growth:** preview gallery 6→12, plan reframing, "how sharing works" (TASK-009).
- **Phase 9 — Analytics:** funnel events (TASK-009).
- **Phase 10 — Launch:** Section 36 gates.

## 34. Codex Implementation Tasks

### TASK-001 — Upgrade Next.js past critical RCE + clear high advisories
**Priority:** P0 · **Area:** Security/Deps · **Effort:** S
**Problem:** Installed `next@16.3.0` is inside GHSA-2xp9-vwfh-vxw4 (unauthenticated RCE, Image Optimization + AVIF; fixed ≥16.3.3). `fast-uri@3.1.5` (override) below fixed 3.1.6; `sharp`, `browserslist` high.
**Evidence:** `package.json:32-38`; `npm audit --omit=dev` 24 Sept (1 critical, 5 high).
**Objective:** No critical/high runtime advisories; build + tests green.
**Implementation:** Bump `next` to latest 16.3.x ≥16.3.3 (respect `engines: 22.x`); raise `overrides.fast-uri` to ≥3.1.6; update `sharp`/`browserslist` transitively where possible without major bumps; keep Sentry 10.x compatible; run `npm run lint`, `npm test`, `npm run build`, `npm run db:verify`.
**Affected:** `package.json`, lockfile, `next.config.ts` (verify headers/CSP unchanged).
**Dependencies:** none — do first.
**Acceptance:** [ ] `npm audit --omit=dev` shows 0 critical and 0 high runtime advisories (dev-only playwright exception must be recorded) · [ ] lint+tests+build+db:verify pass · [ ] `/api/health` 200 post-deploy.
**Testing:** `npm audit --omit=dev`; full validation trio; preview-deploy health check.
**DoD:** Lockfile committed; advisory output pasted into the PR; no behavior change.

### TASK-002 — Reconcile uncommitted atelier tree to green + mobile/perf budgets
**Priority:** P1 · **Area:** UI/QA/Perf · **Effort:** M
**Problem:** Dirty tree breaks 2 contract tests and ships an unverified hero; production/tree visual drift.
**Evidence:** `git status` (4 modified + 4 untracked); `npm test not ok 62, 98`; missing `Attendance by stage` / `الحضور حسب المرحلة` in `app/page.tsx`.
**Objective:** One coherent visual language, 179/179 tests green, LCP/CLS budgets met at 375px.
**Implementation:** Choose atlas vs atelier per `DESIGN.md` intent; restore or intentionally migrate the per-stage attendance strings and update the two contract tests only if the UI replacement is strictly superior (prefer restoring strings); verify `app/invite/preview/` route has noindex metadata; compress `public/brand/atelier/*` (AVIF/WebP, explicit sizes); keep `InvitationClient` `previewMode` (gallery reuse) with reduced-motion respected.
**Affected:** `app/page.tsx`, `app/layout.tsx`, `InvitationClient.tsx`, `DESIGN.md`, `app/wisal-atelier.css`, tests if justified.
**Dependencies:** TASK-001.
**Acceptance:** [ ] `npm test` 179/179 · [ ] no horizontal overflow at 320/360/375/390/414/768/1024/1440 · [ ] touch targets ≥44px on hero CTA/swatches · [ ] throttled LCP <4s, CLS <0.1 on landing + sample invite · [ ] working tree clean, single visual language.
**Testing:** contract suite; Playwright or manual device widths with screenshots; Lighthouse mobile on preview URL.
**DoD:** Commit message explains atlas→atelier decision; screenshots attached.

### TASK-003 — Prove RSVP integrity with two-account runtime tests
**Priority:** P1 · **Area:** Security/QA · **Effort:** M
**Problem:** Code-level fix for name-overwrite/quota-bypass has no runtime proof.
**Evidence:** `lib/wisal-data.ts:503-612`; `app/api/rsvp/route.ts`.
**Objective:** Demonstrate anonymous RSVP cannot hijack managed guests and respects plan quotas under concurrency.
**Implementation:** On an isolated Neon branch: (a) anonymous POST with an existing managed-guest name → expect 409 `RSVP_NAME_CONFLICT`, guest row unchanged; (b) valid personalized token → 201 and row updated; (c) invalid token → 400; (d) private-mode invite without token → 400; (e) parallel anonymous POSTs past guest limit → exactly capped, remainder 409 `GUEST_LIMIT`; (f) cross-event token replay → 400.
**Affected:** `tests/*` (new `rsvp-integrity` E2E, opt-in DB), docs evidence note.
**Dependencies:** TASK-001, TASK-002.
**Acceptance:** [ ] all six cases pass against preview + branch DB · [ ] no managed-guest row mutated by anonymous writes · [ ] evidence (request/response excerpts with redacted PII) recorded.
**Testing:** scripted E2E, runnable via env-gated command; never against production.
**DoD:** RSVP-001 closed with evidence link; Codex must not alter RSVP logic unless a case fails (then file SEC finding first).

### TASK-004 — Prove owner journey: create → publish → share → guests → CSV → upload
**Priority:** P1 · **Area:** Product/QA · **Effort:** L
**Problem:** Core revenue journey never exercised end-to-end.
**Evidence:** studio/dashboard code in `app/page.tsx`; BETA gate §7 smoke list.
**Objective:** Green checklist run on preview + isolated DB with two users (owner A, owner B for isolation).
**Implementation:** Signup/login → create event → 12-concept spot check (≥3) → publish → personal link open tracking → guest CRUD → CSV import 500-row cap + export → cover upload (valid + oversized + wrong-type cases) → cross-owner access attempts (B must get 404/403 on A's event/guests/segments) → AR/EN switch with RTL assertion.
**Affected:** E2E suite, `docs/` evidence note.
**Dependencies:** TASK-002.
**Acceptance:** [ ] BETA §7 smoke items all pass · [ ] all cross-owner attempts denied · [ ] upload rejections correct · [ ] AR/EN + `dir` assertions pass.
**Testing:** Playwright, mobile viewport included (390px) for guest open + RSVP.
**DoD:** FLOW-001 closed; failures become findings, not silent fixes.

### TASK-005 — Monitoring, alerting, and backup runbook proof
**Priority:** P1 · **Area:** DevOps/SRE · **Effort:** S
**Problem:** Sentry/logger installed; nobody proven to be woken up.
**Evidence:** `instrumentation*.ts`, `app/api/ops/sentry-smoke/route.ts`, `lib/logger.ts`, `docs/release/*`.
**Objective:** One synthetic failure → human-visible alert; backup restore re-demonstrated with retention defined.
**Implementation:** Trigger preview-only smoke endpoint, confirm Sentry issue + notification route to owner; define uptime check on `/api/health`; document backup retention schedule + re-run isolated restore drill, record reviewer/date/output.
**Affected:** Sentry project, `docs/operations/*`, Vercel env.
**Dependencies:** TASK-001.
**Acceptance:** [ ] alert received end-to-end (screenshot/log) · [ ] restore drill evidence dated ≥ Sept 2026 · [ ] retention + RPO/RTO written.
**Testing:** synthetic drill on preview only.
**DoD:** OPS-001 + REL-001 closed with evidence.

### TASK-006 — Auth surface + rate-limit review
**Priority:** P1 · **Area:** Security · **Effort:** S
**Problem:** Narrow middleware matcher; shared-DB limiter capacity unproven beyond beta cohort.
**Evidence:** `proxy.ts:10-12`; `lib/public-api-guard.ts`; `lib/auth/identity.ts:17-29` (ChatGPT fallback).
**Objective:** Every private route denied without session; limiter thresholds documented; fallback auth cannot activate in prod.
**Implementation:** Enumerate routes relying on component-level identity vs middleware; add matcher coverage or per-route guards with tests; verify `WISAL_AUTH_PROVIDER=neon` in prod env (fallback path unreachable); load-test public RSVP/open endpoints to limiter thresholds on preview; document beta cohort ceiling.
**Affected:** `proxy.ts`, route handlers, `docs/operations/*`.
**Dependencies:** TASK-001.
**Acceptance:** [ ] unauthenticated matrix (workspace/admin/API) all 401/403/redirect · [ ] 429 + `Retry-After` observed past threshold · [ ] 503-closed behavior on limiter outage (existing test) · [ ] env review recorded.
**Testing:** auth matrix script + k6/Playwright burst on preview.
**DoD:** SEC-003 + AUTH-001 (technical half) closed.

### TASK-007 — Domain cutover + payment acceptance + legal review
**Priority:** P1 · **Area:** DevOps/Commercial · **Effort:** M (owner-involved)
**Problem:** Defaults still point at `wisal-self.vercel.app`; payments unapproved for real money; legal unreviewed.
**Evidence:** `lib/site-url.ts:1`; `docs/LAUNCH_READINESS.md`; `docs/PAYMENT_PRODUCTION_ACCEPTANCE.md`.
**Objective:** Canonical domain live with correct metadata/callbacks; manual payments cleared by two reviewers; counsel sign-off filed.
**Implementation:** Connect domain → set `NEXT_PUBLIC_SITE_URL` → verify robots/sitemap/metadata/OG + Neon Auth callbacks → create owner/support/test accounts → complete payment acceptance (destinations, approve/reject/resubmit/expiry, refund/invoice/tax copy) on staging then production with dual review → file counsel review of privacy/terms/retention/consent/deletion.
**Affected:** Vercel env, `docs/*`, checkout copy.
**Dependencies:** TASK-003, TASK-004, TASK-005.
**Acceptance:** [ ] BETA gate §1–8 + LAUNCH_READINESS list signed with owner/evidence per item · [ ] test transfer approved + rejected + resubmitted on record · [ ] no demo identities in prod.
**Testing:** checklist execution, not code tests.
**DoD:** DOM-001, PAY-001, LEGAL-001 closed with named approvers and dates.

### TASK-008 — Invitation distinctness + mobile guest UX pass
**Priority:** P2 · **Area:** Product/Design · **Effort:** M
**Problem:** 12 concepts registered, 6 showcased; guest mobile UX is launch-critical and partially reworked.
**Evidence:** `lib/invitation-concepts.ts` (12 codes); landing gallery (6); `InvitationClient` opening/layout matrix.
**Objective:** Every concept demonstrably distinct; guest flow flawless at 360–430px.
**Implementation:** Render all 12 via preview route; score visual identity/typography/layout/opening/motion per concept; strengthen or merge weak ones (merge preferred over additive work); runtime-pass RSVP/ICS/share/music-reduced-motion on real mobile widths.
**Affected:** concepts, preview route, gallery (6→12), `InvitationClient`.
**Dependencies:** TASK-002.
**Acceptance:** [ ] 12 distinct concept sheets with screenshots · [ ] guest flow video/screenshots at 390px AR + EN · [ ] `prefers-reduced-motion` verified.
**Testing:** visual review + manual mobile pass.
**DoD:** TPL-001 closed; weak concepts merged with rationale.

### TASK-009 — Analytics funnel + growth slice
**Priority:** P2 · **Area:** Growth · **Effort:** S
**Problem:** Success unmeasurable; plan framing hurts conversion.
**Evidence:** no telemetry; "N-day subscription" copy (`app/page.tsx:766`).
**Objective:** Core loop measurable; copy honest.
**Implementation:** Emit Section 22 events (privacy-safe, no PII); reframe plans as event access with validity; ship "how sharing works" strip + 12-design gallery; draft (do not ship) privacy-safe OG preview design.
**Affected:** event plumbing, landing copy.
**Dependencies:** TASK-002 (copy), TASK-005 (pipeline).
**Acceptance:** [ ] `invitation_opened` + `rsvp_completed` flowing in preview · [ ] subscription wording gone · [ ] gallery complete.
**Testing:** event debugger + copy review.
**DoD:** ANALYTICS-001 + UX-002 closed.

## 35. Dependency Graph

```text
TASK-001 (Next/RCE upgrade)
  ├─→ TASK-002 (atelier reconcile + budgets)
  │     ├─→ TASK-003 (RSVP integrity proof)
  │     ├─→ TASK-004 (owner journey proof)
  │     └─→ TASK-008 (concept distinctness) ─→ TASK-009 (analytics/growth)
  ├─→ TASK-005 (alerts + backup proof)
  └─→ TASK-006 (auth surface review)
        └─→ TASK-007 (domain + payments + legal) ─→ CONTROLLED BETA ─→ paid launch
```

## 36. Launch Gates

**Security:** [ ] TASK-001 done, 0 critical/high runtime advisories · [ ] TASK-003 six cases pass · [ ] TASK-006 auth matrix green · [ ] no tracked secrets.
**Product:** [ ] TASK-004 journey green · [ ] 12 concepts render · [ ] CSV + upload paths proven · [ ] AR/EN RTL pass.
**Mobile:** [ ] 320–430px no overflow, targets ≥44px, guest RSVP at 390px AR+EN.
**Performance:** [ ] LCP <4s / CLS <0.1 throttled on landing + invite.
**QA:** [ ] 179/179 + new E2E green · [ ] lint + build + db:verify green.
**Operations:** [ ] synthetic alert received · [ ] restore drill current · [ ] health/uptime checks live.
**Commercial:** [ ] domain cutover verified · [ ] dual-reviewed payment acceptance · [ ] counsel sign-off filed · [ ] refund/tax copy live.

## 37. Not Recommended for MVP

Native mobile app · microservices split · object-storage migration (plan it, don't build it) · AI translation to 70+ languages · seating planner · QR check-in · guest photo uploads · custom domains · automated WhatsApp/email sending · 3D/excessive motion. Each is real competitor ammunition (Section 25-A) but none blocks the first paid invitation; schedule for V1.1/V2 by demand signal.

## 38. V1.1 (immediately post-launch)

Privacy-safe OG preview cards (SEO-001) · funnel analytics live (TASK-009) · trial/preview tier · plan reframing validation · all-12 showcase · automated reminder nudges (owner-initiated) · reduced-motion + a11y full pass · throttled performance trace on real devices.

## 39. V2 Opportunities

Seating planner · QR check-in · guest galleries · custom domains · messaging credits · post-wedding memory site + thank-yous · family/plus-one modeling · English-first market packaging (Gulf weddings, event verticals).

## 40. Final Verdict

```text
🟡 BETA READY — controlled beta only; NOT ready for paid public launch.
```

**Strongest areas:** segment-scoped invitation model; bilingual invitation renderer; security headers/guards/scoping discipline; DB constraint design + transactional RSVP; honest catalog mechanics; observability foundations.
**Weakest areas:** runtime proof (everything critical is code-correct but unexecuted); dependency hygiene (one critical RCE); dirty-tree discipline (rework breaking gates); commercial ops (payments/legal/domain).
**Biggest launch blockers:** SEC-001 (RCE) → QA-001 (red tests) → RSVP-001/PAY-001 (unproven money-critical paths).
**Biggest competitive weakness:** no trial tier and subscription-framed pricing against $44-once / 300-EGP / no-signup rivals.
**Strongest differentiation opportunity:** per-segment invitations with per-stage RSVP over personal WhatsApp links — nobody surveyed does this; make it the headline.
**Immediate next milestone:** close TASK-001 + TASK-002 within one cycle (green tree, no critical advisories), then execute TASK-003/004 proofs before any commercial promise.

*Codex execution order: Phase 0 → Phase 1 → Phase 2 → Phase 5 (TASK-005/006) → Phase 3 → Phase 4/8/9 → Phase 10 gates. Do not skip evidence recording; every closed P0/P1 must link proof.*

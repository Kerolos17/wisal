# Wisal — Master Product Audit, Competitor Analysis & Launch Roadmap

**Audit date:** 2 September 2026
**Repository:** `E:\wisal`
**Production reviewed:** [wisal-self.vercel.app](https://wisal-self.vercel.app)
**Audit posture:** Evidence-led, read-only audit snapshot. The follow-up execution note below records subsequent roadmap work.
**Market focus:** Egypt first; Arabic-speaking MENA second.

---

## 1. Executive verdict

### 🟡 BETA READY — controlled beta only; not ready for paid public launch

Wisal is a credible, unusually polished beta product. Its landing page, bilingual visual language, six authored invitation concepts, responsive behavior, guest segmentation model, personalized links, and manual-payment workflow are substantially beyond a prototype. The production home page and health endpoint are live, the repository builds, 171 source-contract tests pass, lint is clean, the database migration set verifies, and recent CI is green.

That does **not** yet make the product safe to sell publicly. A tokenless public RSVP can overwrite an existing guest by matching the guest name and can create guests without an event-plan quota check. Public fallback prices disagree with both the live catalog and the seed catalog. Core signup-to-publish and payment-approval journeys are not covered by real browser/database tests. Production alerting, funnel analytics, backup restoration, transactional email delivery, final-domain configuration, payment operations, and legal review remain unverified or absent. A throttled mobile measurement also produced a 6.64 s LCP, well into the poor range.

The correct next move is a short launch-hardening program, not a redesign or feature spree.

### Score

**63/100 — Beta candidate**

| Category | Weight | Score | Assessment |
|---|---:|---:|---|
| Core product completeness | 15 | 11 | Broad workflow and invitation feature set; key live flows unverified |
| UX and conversion | 10 | 7 | Clear and attractive, but long landing narrative and trust gap |
| UI and brand quality | 8 | 7 | Distinctive, coherent, premium visual system |
| Mobile and responsive behavior | 8 | 7 | No tested overflow; controls generally touch-safe |
| Security and privacy | 15 | 9 | Good baseline controls; RSVP integrity and dependency risks block launch |
| Reliability and data integrity | 10 | 6 | Strong schema base; restoration and cross-event invariants need work |
| Performance | 8 | 4 | Lean transfer size, zero measured CLS, but poor throttled LCP |
| QA and regression protection | 7 | 3 | Many passing contracts; too little runtime E2E evidence |
| DevOps and release safety | 5 | 3 | CI and health route exist; production operations incomplete |
| SEO and sharing | 4 | 2 | Good base metadata; invitation privacy and social previews need correction |
| Analytics and observability | 4 | 1 | Request IDs only; no verified monitoring or product telemetry |
| Competitive position | 6 | 3 | Strong aesthetic/segment proposition in a crowded regional market |
| **Total** | **100** | **63** | **Controlled beta; paid launch is a no-go until P1 gates close** |

### Severity summary

| Severity | Count | Meaning |
|---|---:|---|
| P0 | 0 | No confirmed active compromise, irreversible data loss, or total outage |
| P1 | 13 | Must close before paid public launch |
| P2 | 11 | Important for dependable V1.1 |
| P3 | 4 | Quality/scalability improvements |

### Top launch blockers

1. **SEC-001:** tokenless RSVP identity can overwrite an existing guest and bypass plan-level guest limits.
2. **COM-001:** fallback, seeded, and live prices disagree, creating a customer-trust and checkout-consistency risk.
3. **QA-001:** green CI does not execute the real browser + auth + database critical journey.
4. **PAY-001:** production payment accounts, dual review, refund/tax wording, and full acceptance evidence are incomplete.
5. **OPS-001 / REL-001:** no verified monitoring/alerts and no evidenced backup restore drill.
6. **AUTH-001:** signup, login, OAuth, recovery, and delivery behavior lack production acceptance evidence.
7. **PRIV-001:** invitation routes are crawlable by default and inherit generic/canonical metadata.
8. **PERF-001:** mobile throttled LCP measured 6.64 s.

---

## 2. Scope, method, and evidence confidence

### Reviewed

- Application routes, route handlers, middleware/request guards, database schema and migrations.
- Authentication integration, event ownership checks, invitation access, guest/RSVP behavior, payments, uploads, admin permissions, legal pages, SEO files, and deployment configuration.
- Landing page and public error/auth paths in production.
- Responsive rendering at 320, 360, 375, 390, 414, 768, 1024, 1280, and 1440 px; mandatory captures at 375×812, 768×1024, and 1280×800.
- Network failures, console output, horizontal overflow, visible control sizes, language direction, reduced-motion handling, and a throttled mobile performance trace.
- Build, lint, TypeScript/build pipeline, source-contract tests, migration verification, dependency audit, tracked-secret scan, CI history, and production health.
- Current competitor positioning and pricing from official vendor pages.

### Not verified

- Authenticated production workspace/admin because no audit account or write authorization was provided.
- A real customer invitation and real RSVP submission in production.
- A real payment transfer, approval, rejection, refund, or payout/reconciliation operation.
- Production secret values, Neon branch separation, backup retention, point-in-time recovery, alert destinations, or support staffing.
- Real email delivery, spam placement, WhatsApp provider delivery, accessibility with multiple physical assistive technologies, or real-device network performance.

These are explicitly marked **NOT VERIFIED**, not assumed broken.

### Validation results

| Check | Result |
|---|---|
| Source-contract test suite | **171/171 passed** |
| Lint | **Passed** |
| Production build | **Passed** |
| Database verification | **6 migrations + 1 seed passed; 23 public tables documented** |
| Recent GitHub Actions | **Last five inspected runs passed**; [example run](https://github.com/Kerolos17/wisal/actions/runs/33258613361) |
| Production `/api/health` | **HTTP 200; app/database reported healthy on audit date** |
| Production landing resources/console | **No failed resources or page errors observed** |
| Responsive overflow | **None observed at tested widths** |
| Throttled mobile trace | TTFB 307 ms; FCP 2.72 s; LCP 6.64 s; CLS 0; transfer ~398 KB |
| Production environment values | **NOT VERIFIED**; local release checker lacked all six required variables |
| `npm audit --omit=dev` | 8 advisories: 1 high, 7 moderate, 0 critical |

### Audit limitations

Most existing tests are source-string contracts: they verify that expected code shapes and policies remain present, but they do not prove that a user can complete the journey against a real auth tenant and database. Findings based on static code are labeled as such. Recommendations involving Egyptian law and tax are operational prompts for qualified counsel/accounting review, not legal advice.

### Roadmap execution note — 2 September 2026

The first launch-hardening task was implemented after the audit snapshot:

- **TASK-001 complete:** public RSVP no longer upserts a managed guest by name; personalized responses update only the exact guest/event/token; anonymous capacity checks are serialized by an event-row lock and return a conflict when the plan limit is reached; guest/activity/segment writes remain transactional.
- **Files changed:** `lib/wisal-data.ts`, `app/api/rsvp/route.ts`, and `tests/personalized-invites.test.mjs`.
- **Verification:** all 171 source-contract tests pass, including 22 RSVP/security flow tests; TypeScript, lint, and `next build` pass.
- **Remaining caveat:** duplicate-name behavior is intentionally a safe conflict while the database still has its managed guest `(event_id, name)` uniqueness constraint. A future public self-registration identity model can remove that constraint only with a dedicated migration and owner-workflow update.
- **TASK-002 complete:** added a root npm override for `fast-uri@3.1.5` and updated the lockfile to the official registry tarball/integrity. A real npm audit now reports **0 high, 0 critical, and 7 moderate** advisories; the remaining items are existing moderate auth/dev-tool dependency chains and need a separate compatibility upgrade rather than a blind major-version change.
- **TASK-002 verification:** `npm ci --dry-run --ignore-scripts` completed successfully (with the repository’s pre-existing Better Auth peer-resolution warnings); all 171 source-contract tests, TypeScript, lint, and `next build` pass.
- **TASK-003 complete:** pricing is now loaded from the database-backed public catalog without a stale homepage fallback. The approved catalog is Starter 199 EGP / 50 guests, Elegant 599 EGP / 250 guests, and Signature 1,699 EGP / unlimited; the explicit seed, guarded legacy-price migration, and payment-test fixtures match, while checkout and payment requests continue to use the live plan row and immutable payment snapshot.
- **TASK-003 verification:** catalog consistency contracts pass alongside all 174 source-contract tests; TypeScript, lint, and `next build` pass. If the public catalog endpoint fails or returns no active plans, the landing page shows a bilingual unavailable state instead of displaying old prices.
- **TASK-004 complete:** invitation pages now emit generic, query-free private metadata (`noindex,nofollow,noimageindex`) with a slug-only canonical; route headers add `X-Robots-Tag` and `no-referrer`. The robots policy disallows `/invite/` and the sitemap contains no invitation URLs. No invitation-open analytics or server error path logs tokens or request URLs.
- **TASK-004 verification:** invitation-privacy contracts pass with the full 177 source-contract suite, TypeScript, ESLint, and `next build`. Live crawler fetch/Search Console verification remains a deployment follow-up because this change was validated locally.
- **TASK-004 production verification (2 September 2026):** deployed commits `cb3b6d9` and `cc27c3f` now make `https://wisal-self.vercel.app/robots.txt` disallow `/invite/`; the sitemap contains no invitation URLs. An unauthenticated invitation probe returned `X-Robots-Tag: noindex, nofollow, noimageindex` and `Referrer-Policy: no-referrer`; canonical and Open Graph URLs excluded the `g` query token.

---

## 3. Product and architecture map

### What Wisal is today

Wisal is an Arabic/English self-service wedding invitation platform. A couple creates an event, selects an authored template, configures schedule/location/story/media, imports or creates guests, organizes audiences and segments, generates general or personalized invitations, shares links manually—primarily through WhatsApp—and reviews RSVPs. Paid plans use a manual bank/wallet transfer and administrator approval workflow.

### Runtime architecture

```text
Public landing / auth / workspace / invitation / admin
                         │
                 Next.js 16 App Router
            client UI + server route handlers
                         │
       ┌─────────────────┼──────────────────┐
       │                 │                  │
   Neon Auth       Drizzle ORM       request/security layer
                         │
                Neon PostgreSQL
       events, invitations, guests, segments,
       RSVPs, plans, payments, audit/operational data,
       and binary media stored in bytea columns
```

Deployment is a single Vercel/Next.js application configured for `fra1`. This is appropriate for the current scale. A microservice split would add cost and failure modes without addressing current launch blockers.

### Stack inventory

| Layer | Current implementation | Assessment |
|---|---|---|
| Web | Next.js 16.3, React 19.2.6, TypeScript 5.9.3 | Modern; version-specific docs matter |
| UI | Tailwind 4 plus large custom CSS systems, Lucide, self-hosted fonts | Visually strong; monolithic styles create maintenance cost |
| Auth | Neon Auth 0.5 beta, provider-gated integration | Functional architecture; beta/transitive dependency risk |
| Data | Neon PostgreSQL + Drizzle 0.45 | Sound choice and good relational base |
| Media | PostgreSQL `bytea` | Simple for beta; costly scaling path |
| Payments | Customer transfer evidence + admin review | Fits Egyptian MVP, but operational gates are incomplete |
| Messaging | Manual WhatsApp handoff/queue | Honest MVP; not automated delivery |
| Hosting | Vercel, health endpoint, CI | Viable; final domain/monitoring/recovery incomplete |
| Analytics | No verified product analytics package | Missing |
| Observability | Structured-ish console errors/request IDs; no verified service | Insufficient for paid launch |

### Code concentration

- `app/page.tsx`: roughly 1,360 lines / 174 KB.
- `app/globals.css`: roughly 911 lines / 256 KB.
- `app/wisal-atlas.css`: roughly 1,423 lines.
- `lib/wisal-data.ts`: roughly 547 lines.
- Invitation client: roughly 271 lines.

This does not block beta by itself, but it makes regression review, ownership, test isolation, and performance work slower. Decomposition belongs after launch-critical fixes.

---

## 4. Feature inventory and flow audit

### Feature inventory

| Capability | Status | Evidence / note |
|---|---|---|
| Bilingual Arabic/English landing | Implemented | Runtime locale switch updates `lang` and RTL direction |
| Auth signup/login/recovery | Implemented, **NOT VERIFIED end-to-end** | Neon Auth routes/UI exist; no production acceptance account |
| Event creation/editing | Implemented | Workspace code and handlers; browser journey not exercised |
| Six public invitation concepts | Implemented | Clearly differentiated previews |
| Twelve catalog definitions | Partially surfaced | Public/studio deliberately slices to first six |
| Opening styles and invitation layouts | Implemented | Three opening styles and three layout modes in source/contracts |
| Guest import and management | Implemented | CSV/import, groups, segments, personalized links |
| Private/general invitation modes | Implemented | Token model exists; privacy metadata does not match sensitivity |
| RSVP, party size, meal, message | Implemented with **integrity flaw** | See SEC-001 |
| Schedule and maps | Implemented | Guest-facing components and data model |
| Music | Implemented with user opt-in | Reduced-motion behavior also present |
| Manual WhatsApp sharing | Implemented | Queue/handoff; no delivery guarantee |
| Automated WhatsApp reminders | Not implemented | Do not market as delivered capability |
| Plans/checkout | Implemented with catalog drift | See COM-001 |
| Manual transfer evidence | Implemented | Receipt path has stronger magic-byte verification than cover upload |
| Admin payment review | Implemented, production ops incomplete | Permission matrix and transitions exist |
| Legal pages | Implemented, counsel review pending | Privacy and terms are live |
| SEO base | Implemented | Metadata, JSON-LD, sitemap, robots |
| Product analytics | Missing | No funnel instrumentation found |
| Monitoring/alerting | Missing / **NOT VERIFIED** | No provider integration or evidence |
| Transactional sender | Missing / **NOT VERIFIED** | Auth provider behavior alone is insufficient evidence |

### Core flow assessment

#### Discovery → template → pricing → signup

The landing page has a strong premium identity, direct template previews, repeated calls to action, and understandable product mechanics. The visual storytelling is longer than needed on a 375 px screen (~10.6k px document height), but it remains navigable. The illustrative couple quote is correctly labeled “illustrative example,” consistent with the repository rule that no verified customer testimonials exist. The immediate conversion risk is catalog drift: an API failure can expose different prices and even a free Starter tier.

#### Signup → workspace → publish

The source supports this journey, with owner checks around event routes and a structured workspace. It is **NOT VERIFIED** with a real production identity. The local fallback redirects to an unavailable legacy identity path when Neon Auth is not configured; this is a developer-environment/documentation concern, not evidence of a production failure.

#### Share → invitation → RSVP

The invitation experience is feature-rich and mobile-oriented, with personalized/private access, opening modes, segment content, maps, schedule, music opt-in, and bilingual copy. However, a general public link can submit an RSVP without a token. The persistence layer upserts on `(event_id, name)`, allowing a person who knows an existing guest name to change that guest's status/party/meal/message. The same path can add guests without enforcing the plan limit. This is a launch-blocking integrity flaw.

#### Upgrade → transfer → admin decision

The implemented manual-review workflow is suitable for an Egypt-first beta and includes server-side state transitions and receipt verification. The repository’s own acceptance checklist correctly says implementation is not proof of production readiness. External receiving accounts, correct entitlement application, request-info/resubmit/reject/cancel branches, dual-review operations, refund/tax language, monitoring, and release evidence still need completion.

---

## 5. UI, UX, responsive, and accessibility audit

### Visual verdict

The dark plum/copper “celestial atlas” direction is distinctive, coherent, and appropriate for a premium wedding product. Typography, restrained ornament, editorial spacing, template imagery, and bilingual treatment feel intentionally authored rather than assembled from a dashboard kit. The six visible template concepts are distinguishable enough to support choice.

This brand system should be preserved. Launch work should focus on speed, trust, proof, and workflow integrity—not a wholesale visual redesign.

### Responsive capture record

| Viewport | Result |
|---|---|
| 375×812 | Passed: no horizontal overflow; main controls touch-safe; very long page |
| 768×1024 | Passed: stable layout and readable template composition |
| 1280×800 | Passed: coherent editorial rhythm and no failed assets |

Screenshots are stored in the audit visualization directory as `wisal-remote-home-375.png`, `wisal-remote-home-768.png`, and `wisal-remote-home-1280.png`, with matching local captures. Additional automated widths from 320 to 1440 px did not expose horizontal overflow. A desktop-only Next development toolbar artifact was excluded from product control-size analysis.

### Accessibility strengths

- Locale changes set document language and direction.
- Visible landing controls tested at or above approximately 44 px.
- Reduced-motion styles exist globally and within invitation behavior.
- Semantic headings, labels, alt text, and modal roles are present in many key surfaces.
- Checkout QR modal has explicit focus-management behavior.

### Accessibility gaps

Workspace dialogs for event, guest, group, import, message, WhatsApp queue, and segment operations use `role="dialog"`/`aria-modal`, but source review did not find consistent focus trapping, Escape dismissal, initial focus, or focus restoration. Keyboard and screen-reader users can lose context. This is P2 because it is broad and user-facing, though the final release gate should include it.

### Conversion and usability opportunities

- Shorten the mobile landing journey by moving proof, process, and pricing earlier and collapsing secondary editorial content.
- Replace illustrative social proof with clearly labeled demo language until real permissioned testimonials exist.
- Make “one wedding / one event” commercial language explicit; a 365-day “plan” reads like a subscription even though the purchase behavior is event-shaped.
- Show what is and is not automated. “Share on WhatsApp” must not imply managed WhatsApp delivery or reminders.

---

## 6. Performance audit

### Measured production result

On a 390×844 viewport with simulated 4G and 4× CPU slowdown:

| Metric | Result | Interpretation |
|---|---:|---|
| TTFB | 307 ms | Good baseline |
| FCP | 2.72 s | Needs improvement |
| LCP | 6.64 s | Poor; launch-risk on typical mobile conditions |
| CLS | 0 | Excellent |
| Transfer | ~398 KB | Reasonable |
| Decoded resources | ~1.09 MB | Manageable but optimization available |
| JavaScript transfer | ~196 KB | Material for a marketing page |

Google’s current Core Web Vitals guidance treats LCP at or below 2.5 s as good and above 4.0 s as poor: [web.dev LCP guidance](https://web.dev/articles/lcp).

### Likely causes and response

The landing page is a large client component with extensive visual sections and template media. The transfer budget is not catastrophic; the problem is when the largest visual becomes ready and paintable under CPU/network constraint. Measure the exact LCP node in production, prioritize/fetch-size its asset correctly, reduce client-side hydration on the marketing route, defer below-fold template work, and retest on repeatable profiles. Do not “optimize” by damaging the brand before identifying the actual LCP element.

### Performance budget proposed for launch

- Mobile p75 field LCP ≤ 2.5 s; lab guardrail ≤ 3.0 s on agreed profile.
- CLS ≤ 0.1; INP ≤ 200 ms once field data exists.
- No landing-route JavaScript growth without a measured reason.
- No unoptimized hero/template image larger than its rendered need.
- Health endpoint p95 below 500 ms excluding cold-start incidents; alert on sustained failures.

---

## 7. Security, privacy, data, and reliability audit

### Existing strengths

- Ownership checks are present across event APIs.
- Admin permission boundaries and payment state transitions have contract coverage.
- JSON/body-size/same-origin request protections and shared PostgreSQL rate limiting exist; the limiter fails closed.
- Production headers include HSTS, `nosniff`, frame protection, referrer policy, permissions policy, and COOP.
- Production CSP does not use `unsafe-eval`.
- Tracked-secret scan found no committed environment file; the only database-looking string was a placeholder in `.env.example`.
- Database design uses foreign keys, cascades, checks, uniqueness, and indexes extensively.
- Payment evidence upload performs magic-byte validation.

### Material risks

#### Public RSVP integrity

Static trace: `getInvitationBySlug` permits a published public invitation without a token; RSVP input can supply a name; persistence performs an upsert keyed by `(event_id, name)`. This couples identity to a guessable display string and lets an unauthenticated submission update an imported/personalized guest. Open RSVP creation also lacks a plan-limit guard. Rate limiting reduces volume but does not restore identity integrity.

Required design: personalized guests may only update through their unguessable token; open-link RSVP creates a separate self-registered guest record and must never match/update an existing managed guest by name; quota and abuse rules apply atomically.

#### Dependency exposure

`npm audit --omit=dev` reported one high and seven moderate advisories. The high advisory reaches `fast-uri` 3.1.2 through the Neon Auth/auth-UI/validation dependency tree; the fixed line is 3.1.5 or newer. Neon Auth is itself beta and installation emits peer-override warnings around `better-auth`. Exploitability in Wisal’s exact runtime is **NOT VERIFIED**, but an auth-path high advisory must be resolved or formally risk-accepted before launch.

#### Invitation discovery/privacy

Robots currently allow `/invite/`, while the dynamic invitation page has no route-specific `noindex` metadata and inherits a site-root canonical/generic social metadata. Private wedding content should be non-indexable by default. Public opt-in invitations may use safe event metadata, but personalized/private guest names or tokens must never enter OG tags, canonical URLs, logs, sitemaps, or analytics payloads.

#### Relational invariants

Several relations reference entities individually but do not enforce that both referenced records belong to the same event—for example membership group/guest, segment/audience, and segment RSVP/guest. Application checks mitigate this, but database-level composite constraints or triggers should prevent cross-event corruption. Multi-step delete/insert updates should also be atomic.

#### Upload validation

Cover upload checks declared MIME type and 5 MB size, but no magic-byte decode, pixel/dimension ceiling, or re-encoding. Serve headers reduce script interpretation risk, yet decompression bombs and invalid content remain possible. Reuse the stronger receipt-validation pattern and perform safe image decoding.

#### Recovery

Backups, retention, point-in-time recovery, a restore drill, and recovery targets were **NOT VERIFIED**. A provider checkbox is not enough: launch readiness requires evidence that the team can restore into an isolated environment and validate the 23-table application.

### Legal/compliance prompts

Egypt’s Personal Data Protection Center identifies Law 151/2020 and Executive Regulations 816/2025 as the current framework for electronic personal data processing: [PDPC](https://www.pdpc.gov.eg/). Egypt’s Consumer Protection Agency lists Consumer Protection Law 181/2018: [CPA legislation](https://cpa.gov.eg/ar-eg/%D8%AA%D8%B4%D8%B1%D9%8A%D8%B9%D8%A7%D8%AA). The Egyptian Tax Authority maintains electronic invoice/receipt guidance: [ETA e-invoice guidance](https://www.eta.gov.eg/ar/content/e-invoice-services).

Before sales, qualified Egyptian counsel/accounting advice should confirm the controller/processor roles, consent/notice language, deletion and access handling, retention of invitations/guest data/payment evidence, cross-border/cloud processing, minors/sensitive data handling, complaint/refund terms, business identity disclosures, taxation, and invoice/receipt obligations.

---

## 8. QA, DevOps, observability, SEO, and analytics

### QA

The 171 passing contracts are useful regression tripwires, particularly for ownership and payment implementation patterns. They are not a substitute for runtime tests. A file can contain the expected string while the route is unreachable, auth cookies are misconfigured, the database branch is wrong, or the UI cannot complete the action.

The minimum launch suite should exercise in an isolated production-like environment:

1. Signup/login/logout/recovery and OAuth callback if offered.
2. Create event, select template, edit bilingual content, publish.
3. Import/add guest, generate personalized/general links.
4. Open private/public invitation on mobile, RSVP, edit allowed response, reject forged update.
5. Start upgrade, upload valid/invalid evidence, admin request-info/approve/reject, verify entitlement.
6. Verify owner isolation, admin permission denial, rate limiting, upload restrictions, and audit records.

### DevOps and release

CI performs clean install, contracts, lint, type/build work, and has been green. Production health is currently healthy. The public canonical domain still resolves to the temporary Vercel hostname, and production/preview environment values were not independently verified. Establish one environment matrix, validate auth callback URLs and database separation, run a final-domain rehearsal, and document rollback.

### Observability

Request IDs and error logs are a useful base, but no Sentry-equivalent error aggregation, uptime monitor, latency/error dashboards, or actionable alert routing was verified. Paid launch needs alerts for health/database failures, 5xx rate, RSVP failure, invitation resolution failure, payment transition failure, and auth callback failure—with PII redaction.

### Product analytics

No product analytics implementation was found. Instrument a consent-appropriate, PII-free funnel:

`landing_view → template_preview → signup_start → signup_complete → event_created → invitation_published → share_link_copied → invitation_opened → rsvp_submitted → upgrade_started → payment_evidence_submitted → plan_activated`

Track event/plan/template identifiers only in pseudonymous form; never send guest names, phones, messages, invite tokens, receipt images, or full invitation URLs to analytics.

### SEO and sharing

The base is competent: global metadata, JSON-LD, robots, sitemap, legal pages, Open Graph, and Twitter metadata. Correct the temporary canonical domain, invitation indexing behavior, and social-image format. Invitation sharing should use a 1200×630-class safe preview. Private/personalized links should show generic event-safe content and strip query/token data.

---

## 9. Competitive analysis

Research was refreshed on 2 September 2026 from official product/pricing pages. Prices and features can change; validate again immediately before commercial launch.

| Product / region | Position and notable features | Public pricing observed | Implication for Wisal |
|---|---|---|---|
| [Da3wa](https://www.da3wa.app/?lang=en) / MENA | Arabic/English, 36 animated designs, RSVP, guest list, seating, QR check-in | Free/30 guests; $12/200; $29 unlimited per event | Very direct value competitor; broad operations at low price |
| [Farhena](https://www.farhena.com/) / Egypt | Personalized links, RSVP/open tracking, Arabic/English, WhatsApp, EGP payment | EGP 499 one-time, unlimited guests, active 30 days after wedding | Most important local price/position benchmark |
| [Daawah](https://daawah.app/) / Saudi-Gulf | Arabic-first WhatsApp delivery, live RSVP, reminders, QR check-in | SAR 249/50 through SAR 1,499/750 | Operational automation beats Wisal today |
| [INVE](https://app.inve.services/en) / Saudi | WhatsApp, RSVP, automatic QR messages, scanners, analytics | SAR 279/75; 489/150; 710/300 | Shows willingness to pay for managed guest operations |
| [Waraqa](https://www.waraqa.digital/waraqa) / UAE | Live page + video; template and custom studio service | AED 549 template sale; AED 1,799 custom sale | Premium service anchor, not pure SaaS benchmark |
| [Lumaro](https://www.lumarodigital.com/) / Qatar-Gulf | Arabic-first premium invitations, WhatsApp, RSVP | QAR 900 Pearl; QAR 1,800 Gold | Supports higher-touch luxury positioning |
| [invitationJo](https://www.invitation-jo.com/) / Jordan | Cinematic invitations, music, RSVP, bilingual add-ons | From JOD 39 / 69; add-ons | Cinematic visuals are already a category feature |
| [Greenvelope](https://www.greenvelope.com/wedding-invitations) / Global | Designer collections, envelope, guest management, RSVP | Single mailing from $19 | Strong design + mature sending baseline |
| [Paperless Post](https://www.paperlesspost.com/pricing) / Global | Email/text/link sharing, RSVP, broadcasts | Free; roughly $0.50–$1.44 per guest tiers | Familiar usage-based benchmark |
| [Joy](https://withjoy.com/pricing/) / Global | Free wedding site, unlimited guests, RSVP, registry, collaboration | Free | Makes generic wedding-site features hard to monetize alone |
| [Canva](https://www.canva.com/create/wedding-invitations/) / Global | Huge template/asset library, drag-and-drop, print/social | Free/freemium ecosystem | Creation flexibility is commoditized; operations are the moat |

### Competitive conclusion

“Arabic-first + cinematic invitation” is attractive but not defensible by itself. Regional competitors already combine Arabic, RSVP, WhatsApp, QR check-in, analytics, reminders, seating, and low one-event prices. Wisal’s strongest present wedge is:

> **An Egypt-first, premium self-service wedding invitation with trustworthy EGP pricing, genuinely polished Arabic/English design, and family/segment-scoped personalized guest experiences—shared cleanly through WhatsApp.**

The most promising differentiator is segment/audience-level content and access, not the existence of digital invitations. Prove that couples value it before expanding into seating, QR check-in, or automated messaging.

### Pricing and packaging recommendation

Current live public values observed through the platform-content endpoint were Starter EGP 199/50 guests, Elegant EGP 599/250, and Signature EGP 1,699/unlimited, each represented internally with 365-day duration. Source fallback/seed values were Starter EGP 0, Elegant EGP 899, Signature EGP 1,699.

After eliminating drift, test a one-event model:

- **Starter:** low-risk paid trial for small weddings; avoid “free” unless strategically deliberate.
- **Elegant:** hero plan near the local one-time benchmark, with personalized links and segments.
- **Signature:** premium design/support/guest operations, not merely “unlimited.”

Describe entitlement as “one wedding, active until X days after the wedding” rather than an annual subscription unless renewal is a real customer need. Do not race Da3wa/Joy on feature count or free pricing; sell local trust, aesthetics, segmentation, and service reliability.

---

## 10. Detailed finding register

| ID | Sev. | Domain | Observation / evidence | Impact | Recommendation |
|---|---|---|---|---|---|
| SEC-001 | P1 | Security/data | Tokenless public RSVP accepts a supplied name and upserts on event+name; creation lacks plan quota enforcement | Guest response tampering and guest-limit bypass | Token-bound updates; separate open registration; atomic quota/abuse controls |
| SEC-002 | P1 | Supply chain | Production audit reports 1 high + 7 moderate; high `fast-uri` is in auth dependency tree; Neon Auth beta/peer warnings | Auth-path exposure and fragile upgrades | Upgrade/pin fixed tree, retest auth, document residual risk |
| COM-001 | P1 | Commerce | Fallback/seed 0/899/1699 differs from live 199/599/1699 EGP | Misleading offer, support disputes, checkout inconsistency | One authoritative catalog plus fail-safe rendering and contract tests |
| PERF-001 | P1 | Performance | Mobile throttled LCP 6.64 s | Conversion and search/experience risk | Identify LCP node, reduce hydration, optimize priority media, field-measure |
| QA-001 | P1 | QA | 171 tests are predominantly source contracts; critical runtime journey not covered | Green CI can ship broken auth/publish/payment | Add isolated browser/API/database E2E suite |
| OPS-001 | P1 | Observability | No verified error aggregation, uptime alerting, dashboards, or incident route | Silent paid-customer failures | Add redacted telemetry, SLOs, alerts, ownership |
| AN-001 | P1 | Analytics | No product funnel instrumentation | Cannot diagnose activation or price/package fit | Implement PII-free event taxonomy and funnel dashboard |
| REL-001 | P1 | Recovery | Backup/PITR policy and restore drill **NOT VERIFIED** | Unproven recovery from deletion/corruption | Define RPO/RTO and complete isolated restore drill |
| AUTH-001 | P1 | Auth/email | Full production auth/recovery/email delivery **NOT VERIFIED**; provider beta | Users may be locked out or miss recovery | Production acceptance matrix and transactional sender evidence |
| PAY-001 | P1 | Payments/ops | Repository acceptance checklist retains unchecked production and manual branches | Incorrect entitlement, reconciliation, refund/support risk | Complete every branch with two-person evidence and runbook |
| LEGAL-001 | P1 | Legal | Legal pages say final review is required; lifecycle/tax duties unresolved | Regulatory and consumer dispute exposure | Egyptian counsel/accountant review and operationalize rights/retention |
| PRIV-001 | P1 | Privacy/SEO | `/invite/` allowed to crawl; dynamic pages lack safe route metadata/noindex | Wedding data discovery and token leakage via sharing/analytics | Noindex by default; safe opt-in metadata; strip sensitive URLs |
| DOM-001 | P1 | Release/SEO | Canonical/auth public base remains temporary Vercel host; env separation **NOT VERIFIED** | Brand trust, callback, canonical, and deployment risk | Final domain + DNS/TLS/callback/env rehearsal |
| A11Y-001 | P2 | Accessibility | Workspace dialogs lack consistent focus trap, Escape, initial/return focus | Keyboard/screen-reader workflow failure | Shared accessible dialog primitive and automated/manual tests |
| DATA-001 | P2 | Data integrity | Cross-event membership/segment relations not fully enforced in DB | Application bug could corrupt tenant/event boundaries | Composite constraints/triggers plus migration verification |
| DATA-002 | P2 | Reliability | Some multi-delete/insert edits are not visibly transactional | Partial updates under mid-request failure | Wrap state transitions in transactions; add fault tests |
| MEDIA-001 | P2 | Upload security | Cover upload trusts MIME/size without magic bytes/decode/dimension limit | Invalid/decompression-heavy image risk | Decode/re-encode and enforce format, pixels, bytes |
| TPL-001 | P2 | Product/admin | 12 catalog rows exist; public/studio filters to the first six | Admin “active” state can disagree with product availability | Explicit `publicly_selectable`/sort contract or remove dormant rows |
| I18N-001 | P2 | Localization | Large hardcoded bilingual branches and root-level metadata | Translation drift; limited locale SEO and maintainability | Central typed messages and localized metadata strategy |
| ARCH-001 | P2 | Maintainability | Very large page/data/style modules | High regression and review cost | Decompose by route/domain after P1 closure |
| UX-001 | P2 | Conversion | Mobile landing is ~10.6k px and proof/process/pricing are dispersed | Slow comprehension and CTA fatigue | Test shorter hierarchy; move proof/pricing earlier |
| SEO-001 | P2 | Sharing | Generic square OG/canonical behavior for invitation sharing | Weak WhatsApp preview and possible incorrect canonical | Safe per-invite 1200×630 preview and metadata tests |
| COMM-001 | P2 | Product truth | Manual WhatsApp handoff exists; automation/reminders do not | Market comparison and expectation gap | Clarify copy; validate provider/compliance before automation |
| CSP-001 | P2 | Security hardening | CSP permits inline script/style | Reduces XSS containment strength | Adopt nonce/hash path incrementally; verify Next compatibility |
| TEST-002 | P3 | QA | No verified coverage report or mutation signal | Unknown untested logic | Add targeted coverage budgets for domain code, not vanity total |
| DESIGN-001 | P3 | Design system | Strong design exists mainly in large route/style files | Inconsistent future work and slower onboarding | Document tokens/components/states with examples |
| PERF-002 | P3 | Scalability | Binary media stored in PostgreSQL | Backup size, DB egress, and cost grow with usage | Set thresholds and migrate to object storage when triggered |
| OPS-002 | P3 | Operations | Support/escalation/reconciliation runbooks incomplete | Slow, inconsistent incident/customer response | Build concise owner-backed operating playbooks |

---

## 11. Prioritized launch roadmap

Every task below is independently assignable to Codex. Phase numbers express sequencing, not permission to deploy.

### Phase 0 — integrity containment

#### TASK-001 — Make public RSVP identity and quotas tamper-resistant

- **Priority / finding:** P1 — SEC-001
- **Goal:** Prevent tokenless users from modifying managed guests and prevent open RSVP from bypassing event limits.
- **Scope:** Invitation resolution, RSVP route, persistence transaction, guest/token schema as needed, rate/abuse response, regression tests.
- **Implementation:** Require a valid personalized token to update an imported/personalized guest. Treat public-link RSVP as a new self-registered identity with a server-generated identifier; never resolve it solely by name. Enforce event plan capacity and duplicate policy in the same transaction. Preserve legitimate RSVP editing through a scoped capability token.
- **Acceptance criteria:** (1) Tokenless `Layla` cannot alter an existing `Layla`; (2) valid guest token can update only its guest/event; (3) open registration creates a distinct record; (4) concurrent final-capacity submissions cannot exceed quota; (5) forged/cross-event tokens return non-enumerating errors; (6) API and browser tests cover all cases.
- **Verification:** Isolated DB integration tests, concurrent requests, Playwright personalized/public flows, ownership/security review.
- **Dependencies:** None.
- **Effort:** M (2–4 days).
- **Rollback:** Feature-flag open RSVP off while retaining tokenized RSVP.

#### TASK-002 — Remediate the production dependency advisory chain

- **Priority / finding:** P1 — SEC-002
- **Goal:** Remove the high auth-tree advisory and stabilize the supported auth dependency set.
- **Scope:** Lockfile, Neon Auth/better-auth/auth-UI/resolver/`fast-uri` chain, CI audit gate, auth regression.
- **Implementation:** Upgrade to mutually supported versions that resolve `fast-uri` to ≥3.1.5; do not use a blind override unless runtime compatibility is proven. Record any remaining moderate advisory with reachability and owner/date.
- **Acceptance criteria:** Production audit has zero high/critical findings; install has no unexplained peer override; signup/login/logout/recovery/callback tests pass; lockfile diff is reviewed.
- **Verification:** Clean `npm ci`, audit, build, runtime auth suite, dependency tree inspection.
- **Dependencies:** None.
- **Effort:** S–M (1–3 days).
- **Rollback:** Revert lockfile/package changes and disable public signup if an auth regression appears.

### Phase 1 — commercial truth and privacy

#### TASK-003 — Establish one authoritative plan catalog

- **Priority / finding:** P1 — COM-001
- **Goal:** Ensure landing, checkout, entitlements, seed data, and fallback behavior always agree.
- **Scope:** Plan source, platform-content API, seed/migration, public pricing UI, checkout validation, tests.
- **Implementation:** Choose the approved EGP prices/limits; derive public and checkout presentation from one versioned source. On catalog failure, show a retry/unavailable state instead of stale contradictory commercial terms.
- **Acceptance criteria:** API, seed, landing, checkout, and activated entitlement match exactly; catalog failure never shows an unauthorized free/alternate price; tests fail on drift; admin price change has an auditable publication path.
- **Verification:** Contract + runtime API/browser tests and production preview comparison.
- **Dependencies:** Commercial owner decision on final prices.
- **Effort:** S (1–2 days).
- **Rollback:** Restore prior catalog version, not hardcoded component values.

#### TASK-004 — Make invitations private-by-default in search and sharing

- **Priority / finding:** P1 — PRIV-001
- **Goal:** Prevent unintended indexing or metadata leakage from invitation URLs.
- **Scope:** Dynamic metadata, robots directives, canonical policy, token/query handling, sitemap, analytics redaction.
- **Implementation:** Emit `noindex,nofollow` for invitation pages by default. Permit index only via explicit event opt-in and safe public slug. Never include guest name/token/query in metadata, logs, referrers, or analytics.
- **Acceptance criteria:** Private/personalized invitation HTML contains noindex; robots policy is consistent; sitemap contains no invite; OG/canonical exclude token/guest data; crawler tests cover public/private cases.
- **Verification:** Rendered metadata tests, production-preview curl/browser inspection, search-console checklist.
- **Dependencies:** None.
- **Effort:** S (1–2 days).
- **Rollback:** Global noindex on all invitation routes.

#### TASK-005 — Complete manual-payment production acceptance

- **Priority / finding:** P1 — PAY-001
- **Goal:** Make every payment state operationally safe and evidenced.
- **Scope:** Receiving accounts, upload, draft/cancel, submit, request-info/resubmit, reject, approve, entitlement, audit log, refund/support/tax copy.
- **Implementation:** Execute the repository checklist with two reviewers and synthetic transactions; capture IDs/timestamps/screenshots without exposing sensitive account data; define reconciliation and duplicate-payment handling.
- **Acceptance criteria:** Every checklist branch passes; approval grants the exact purchased plan/expiry once; repeated decisions are idempotent; refund and support paths have named owners; account details and customer copy are approved.
- **Verification:** Staging/full production-like rehearsal plus database/audit-log inspection.
- **Dependencies:** TASK-003; receiving-account and policy owners.
- **Effort:** M (3–5 days).
- **Rollback:** Disable upgrade CTA and accept no new evidence while preserving review access.

### Phase 2 — production identity, domain, and recovery

#### TASK-006 — Cut over to the final domain with a verified environment matrix

- **Priority / finding:** P1 — DOM-001
- **Goal:** Make domain, auth, canonical, database, and deployment settings explicit and reproducible.
- **Scope:** DNS/TLS, `NEXT_PUBLIC_SITE_URL`, Neon Auth base/callback/cookies, owner identity, preview/production DB separation, Vercel configuration.
- **Implementation:** Create an owner-approved environment matrix containing presence/source/rotation owner—not secret values. Rehearse final hostname in preview, then cut DNS with rollback TTL and redirects.
- **Acceptance criteria:** HTTPS/HSTS valid; canonical/OG/sitemap use final host; login/recovery callbacks stay on final host; preview cannot access production DB; health passes; old hostname redirects safely.
- **Verification:** DNS/TLS checks, browser auth suite, environment fingerprints, production smoke.
- **Dependencies:** Final-domain ownership.
- **Effort:** M (2–4 days plus DNS propagation).
- **Rollback:** Restore previous DNS and application hostname while preserving database state.

#### TASK-007 — Prove authentication and transactional delivery

- **Priority / finding:** P1 — AUTH-001
- **Goal:** Demonstrate that all offered identity flows work for real users.
- **Scope:** Signup, verification if used, login, logout, recovery, OAuth if shown, cookie/session expiry, email sender/domain, abuse limits.
- **Implementation:** Configure a production-grade sender and SPF/DKIM/DMARC where Wisal owns delivery; document which messages Neon sends. Test Arabic/English templates and privacy-safe URLs.
- **Acceptance criteria:** Every displayed auth path passes on mobile/desktop; recovery arrives to major mailbox providers; no open redirect or account enumeration; session revoke/expiry works; support fallback is documented.
- **Verification:** Production-preview test accounts, inbox evidence, security tests, log redaction check.
- **Dependencies:** TASK-002, TASK-006.
- **Effort:** M (3–5 days).
- **Rollback:** Hide unsupported OAuth/signup paths; preserve login for existing users and support recovery manually.

#### TASK-008 — Establish backup, restore, and rollback evidence

- **Priority / finding:** P1 — REL-001
- **Goal:** Prove recoverability for user and payment data.
- **Scope:** Neon backups/PITR, retention, encryption/access, restore procedure, schema/data validation, deployment rollback.
- **Implementation:** Approve RPO/RTO, restore a recent backup into an isolated branch, run migrations/read-only integrity checks, sample invitations/payments, and time the exercise.
- **Acceptance criteria:** Approved RPO/RTO; successful isolated restore; all expected tables/migrations present; sample relationships valid; named incident owner; quarterly drill scheduled.
- **Verification:** Dated restore report with non-sensitive query outputs and elapsed time.
- **Dependencies:** Environment owner access.
- **Effort:** S–M (1–3 days).
- **Rollback:** Not applicable; drill must never target production.

### Phase 3 — real regression and production telemetry

#### TASK-009 — Add a production-like critical-journey E2E suite

- **Priority / finding:** P1 — QA-001
- **Goal:** Make green CI mean the product’s critical journey actually works.
- **Scope:** Playwright/API fixtures, isolated Neon branch, auth test users, event/publish/share/RSVP/payment/admin flows, cleanup.
- **Implementation:** Seed deterministic data per run; test via user-visible behavior and database invariants, not source strings. Keep secrets in CI and make retries diagnostic rather than masking flakes.
- **Acceptance criteria:** The six journeys in §8 pass; tenant isolation and SEC-001 regressions are covered; failures retain sanitized traces/screenshots; suite is repeatable and leaves no cross-run data.
- **Verification:** Three consecutive clean CI runs and one intentional-failure demonstration.
- **Dependencies:** TASK-001, TASK-003, TASK-005, TASK-007.
- **Effort:** L (5–8 days).
- **Rollback:** Keep suite non-blocking briefly while stabilizing; never remove existing contracts.

#### TASK-010 — Add privacy-safe monitoring, SLOs, and alerts

- **Priority / finding:** P1 — OPS-001
- **Goal:** Detect customer-impacting failures before support reports them.
- **Scope:** Error aggregation, uptime probes, structured logs, route metrics, dashboards, alerts, runbooks.
- **Implementation:** Instrument health, auth callback, invitation resolution, RSVP, payment transitions, and platform catalog. Redact tokens, phone/name/message/receipt data. Define alert thresholds and owners.
- **Acceptance criteria:** Synthetic failure generates an actionable alert; dashboard shows rate/latency/error by route; request ID links logs without PII; on-call acknowledgement path is tested.
- **Verification:** Alert fire drill and redaction review.
- **Dependencies:** TASK-006.
- **Effort:** M (3–5 days).
- **Rollback:** Disable noisy alert rules independently without disabling error capture.

#### TASK-011 — Instrument the activation and revenue funnel

- **Priority / finding:** P1 — AN-001
- **Goal:** Measure where couples activate, publish, share, receive RSVP, and upgrade.
- **Scope:** Event taxonomy listed in §8, consent/cookie policy as applicable, dashboards, retention rules.
- **Implementation:** Use pseudonymous account/event IDs and controlled properties. Deduplicate server-confirmed conversions. Document data ownership and deletion behavior.
- **Acceptance criteria:** Funnel events appear once with correct order; no guest PII/token/full URL enters payloads; opt-out/consent behavior matches approved policy; dashboard segments by locale/template/plan.
- **Verification:** Analytics debugger, payload inspection, delete-user test, sample funnel reconciliation.
- **Dependencies:** TASK-004; legal approval in TASK-012 can run alongside implementation planning.
- **Effort:** M (3–5 days).
- **Rollback:** Kill switch disables collection without affecting product flows.

### Phase 4 — legal and performance gates

#### TASK-012 — Close legal, privacy-rights, retention, and tax operations

- **Priority / finding:** P1 — LEGAL-001
- **Goal:** Convert legal copy into executable customer/data operations.
- **Scope:** Counsel/accountant review, privacy/terms/refunds, controller disclosures, access/delete workflow, retention schedule, payment evidence, invoices/receipts.
- **Implementation:** Create a data inventory and lifecycle table, implement account/event deletion or documented assisted process, define legal holds, and update customer copy in both languages.
- **Acceptance criteria:** Written professional sign-off or documented approved changes; request intake/identity verification/SLA/fulfillment tested; retention jobs/processes have owners; sale/refund/tax disclosures approved.
- **Verification:** Tabletop data-request and refund exercise; bilingual content review.
- **Dependencies:** Business/legal owners; informs TASK-011.
- **Effort:** M–L (4–10 days, external timing dependent).
- **Rollback:** Pause sales/analytics collection that lacks an approved basis.

#### TASK-013 — Bring mobile LCP inside the launch budget

- **Priority / finding:** P1 — PERF-001
- **Goal:** Reach ≤3.0 s agreed lab LCP and create a path to ≤2.5 s field p75.
- **Scope:** Landing LCP element, images/fonts, server/client boundary, below-fold work, measurement CI.
- **Implementation:** Capture the exact LCP candidate; correct `sizes`/priority/preload; server-render static marketing sections; dynamically defer non-critical template interaction; retain visual fidelity.
- **Acceptance criteria:** Median of five controlled runs ≤3.0 s, CLS ≤0.1, no broken locale/template behavior, no transfer/JS regression beyond approved budget; field monitoring configured.
- **Verification:** Repeatable Lighthouse/Playwright trace on mobile profile and production-preview Web Vitals.
- **Dependencies:** TASK-010 for field telemetry is preferred, not blocking lab work.
- **Effort:** M (3–5 days).
- **Rollback:** Revert each optimization independently using measured before/after evidence.

### Phase 5 — usability and data hardening

#### TASK-014 — Standardize accessible dialogs

- **Priority / finding:** P2 — A11Y-001
- **Goal:** Make every workspace modal usable by keyboard and screen reader.
- **Scope:** Seven workspace dialog families and checkout dialog consistency.
- **Implementation:** Introduce a shared primitive with label/description, initial focus, trap, Escape, outside-click policy, scroll lock, and opener focus restoration.
- **Acceptance criteria:** Keyboard cannot escape open modal; Escape behavior is consistent; focus returns to opener; screen reader announces title/state/errors; automated axe has no serious/critical modal violation.
- **Verification:** Playwright keyboard suite, axe, NVDA/VoiceOver spot check.
- **Dependencies:** None.
- **Effort:** M (3–5 days).
- **Rollback:** Migrate dialogs incrementally; retain existing component until each passes.

#### TASK-015 — Enforce event-scoped relational invariants and atomic edits

- **Priority / finding:** P2 — DATA-001, DATA-002
- **Goal:** Make cross-event corruption impossible at the database boundary.
- **Scope:** Group membership, audience/segment access, segment RSVP, related multi-write edits.
- **Implementation:** Audit existing data; add composite unique keys/FKs or guarded triggers; wrap delete/insert replacements in transactions; produce reversible migration.
- **Acceptance criteria:** Cross-event inserts fail at DB level; valid existing data migrates; fault injected between writes rolls back; migration applies/rolls back on a production-sized clone.
- **Verification:** Migration verification, integration and fault tests, constraint catalog inspection.
- **Dependencies:** TASK-008 restore capability first.
- **Effort:** M–L (4–7 days).
- **Rollback:** Tested down migration or forward corrective migration; snapshot before apply.

#### TASK-016 — Harden cover-image ingestion

- **Priority / finding:** P2 — MEDIA-001
- **Goal:** Accept only safe, bounded images.
- **Scope:** Cover upload route, storage metadata, rendering, error copy.
- **Implementation:** Verify signature, decode image, enforce allowed formats/pixels/frames/bytes, strip metadata, and re-encode to a known format. Reject malformed/polyglot content.
- **Acceptance criteria:** Valid JPEG/PNG/WebP pass; MIME spoof, truncated file, huge dimensions, animated abuse, and non-image fail; final stored output is bounded and renders.
- **Verification:** Malicious fixture suite, memory/time limits, browser upload test.
- **Dependencies:** None.
- **Effort:** S–M (2–3 days).
- **Rollback:** Temporarily disable custom cover uploads while retaining existing media.

#### TASK-017 — Make template availability explicit

- **Priority / finding:** P2 — TPL-001
- **Goal:** Align admin catalog state with what customers can select.
- **Scope:** Template schema/seed/API/admin/public/studio ordering.
- **Implementation:** Replace positional `slice(0,6)` behavior with explicit published/selectable state and sort order, or archive the six unsupported definitions.
- **Acceptance criteria:** Every admin-active/selectable template appears once publicly and in studio; inactive does not; ordering is deterministic; preview/publish works for each selectable template.
- **Verification:** Catalog contract, admin/browser matrix for all templates.
- **Dependencies:** TASK-003 catalog conventions.
- **Effort:** S–M (2–3 days).
- **Rollback:** Set only the current six as selectable.

### Phase 6 — conversion, sharing, and maintainability

#### TASK-018 — Improve WhatsApp sharing previews safely

- **Priority / finding:** P2 — SEO-001
- **Goal:** Produce attractive previews without leaking guest or token data.
- **Scope:** OG image generation/static variants, metadata, cache behavior, URL sanitizer.
- **Implementation:** Generate 1200×630 event-safe images using couple/event fields only when allowed; private/personalized links use a generic branded preview.
- **Acceptance criteria:** WhatsApp/Facebook/X debuggers show correct image/title; tokens/names never appear; cache invalidation is documented; fallback is branded and valid.
- **Verification:** Social debugger screenshots and metadata security tests.
- **Dependencies:** TASK-004, TASK-006.
- **Effort:** M (3–5 days).
- **Rollback:** Generic Wisal OG image for every invitation.

#### TASK-019 — Clarify one-event packaging and test a shorter landing hierarchy

- **Priority / finding:** P2 — UX-001, COMM-001; competitive response
- **Goal:** Improve comprehension without adding product scope.
- **Scope:** Packaging names/duration copy, WhatsApp truth, landing section order, real proof policy.
- **Implementation:** Present one-event entitlement and end date, label manual sharing accurately, move templates/pricing/process earlier, and use only permissioned testimonials or explicit demos.
- **Acceptance criteria:** No subscription ambiguity; no automation claim; mobile journey to price/CTA is shorter; experiment has defined activation/upgrade outcome and guardrails.
- **Verification:** Content review, 5-user task test, analytics experiment after TASK-011.
- **Dependencies:** TASK-003, TASK-011, legal copy from TASK-012.
- **Effort:** M (3–5 days plus experiment runtime).
- **Rollback:** Restore prior section order/copy through versioned content.

#### TASK-020 — Decompose the highest-risk monoliths

- **Priority / finding:** P2 — ARCH-001, I18N-001
- **Goal:** Lower regression cost without changing behavior.
- **Scope:** `app/page.tsx`, `lib/wisal-data.ts`, large CSS, bilingual messages; no redesign.
- **Implementation:** Extract marketing/workspace domains, route-specific server/client boundaries, typed message catalogs, repositories/services with transactional boundaries, and scoped styles/tokens.
- **Acceptance criteria:** No visual/behavior regression at capture matrix; bundle/LCP not worse; public APIs unchanged or migrated; unit/integration coverage added around extracted logic.
- **Verification:** Screenshot diff, E2E suite, bundle/performance comparison, code review.
- **Dependencies:** TASK-009 and TASK-013 should establish safety baselines first.
- **Effort:** L (8–15 days, incremental).
- **Rollback:** Small commits by extraction boundary; avoid combined rewrite.

### Phase 7 — launch rehearsal

#### TASK-021 — Run and sign the paid-launch rehearsal

- **Priority / finding:** Release gate across all P1s
- **Goal:** Produce one decision packet proving readiness, rollback, and ownership.
- **Scope:** Final domain, auth, create/publish/share/RSVP, payment, monitoring, restore evidence, legal copy, support, mobile/performance.
- **Implementation:** Execute the Definition of Done below in production-like preview, then a tightly controlled production smoke with synthetic data. Record owner, timestamp, result, evidence link, and residual risk for each gate.
- **Acceptance criteria:** All P1 findings closed or explicitly risk-accepted by accountable owner; zero unresolved security/privacy/payment P1; rollback drill passes; support/incident contacts active; go/no-go signed.
- **Verification:** Independent reviewer reproduces the critical path and samples the evidence packet.
- **Dependencies:** TASK-001 through TASK-013; TASK-014 strongly recommended before public sale.
- **Effort:** M (2–4 days).
- **Rollback:** No-go leaves controlled beta active; disable new paid acquisition/checkout.

### Phase 8 — validated expansion only

#### TASK-022 — Define thresholds for object storage and messaging automation

- **Priority / finding:** P3/P2 — PERF-002, COMM-001
- **Goal:** Avoid premature infrastructure while making future decisions measurable.
- **Scope:** DB media volume/egress thresholds; WhatsApp Business provider, consent/template/compliance, delivery/status costs; reminder demand.
- **Implementation:** Instrument storage growth and manual-share pain; compare approved providers and legal requirements; write an ADR with trigger thresholds.
- **Acceptance criteria:** No migration/provider commitment without demand and cost data; thresholds, owner, rollback, consent, and data-retention implications documented.
- **Verification:** ADR review and cost model against real beta usage.
- **Dependencies:** TASK-010, TASK-011, TASK-012.
- **Effort:** S–M (2–4 days research; implementation separate).
- **Rollback:** Retain database media/manual handoff until thresholds are met.

---

## 12. Dependency graph and execution order

```text
TASK-001 RSVP integrity ───────────────┐
TASK-002 dependency/auth fix ──> TASK-007 auth proof ─┐
TASK-003 catalog truth ──> TASK-005 payment proof ────┤
        └───────────────> TASK-017 templates          │
TASK-004 invite privacy ──> TASK-018 sharing          │
TASK-006 domain/env ──────> TASK-007 / TASK-010 / 018 │
TASK-008 restore ─────────> TASK-015 data constraints │
TASK-012 legal ───────────> TASK-011 analytics / 019  │
TASK-010 telemetry ───────> TASK-013 field performance│
TASK-001/003/005/007 ─────> TASK-009 E2E              │
TASK-009 + TASK-013 ──────> TASK-020 decomposition    │
All launch P1 tasks ──────────────────> TASK-021 GO/NO-GO
TASK-010/011/012 ─────────────────────> TASK-022 expansion ADR
```

Recommended critical path: **001 → 003 → 005 → 009**, while **002 → 006 → 007**, **004**, **008**, **010**, **011/012**, and **013** proceed in parallel where ownership permits. Do not let the refactor or feature expansion delay integrity, payment, identity, monitoring, and recovery gates.

---

## 13. Priority matrix

### Must — before paid public launch

- TASK-001 through TASK-013.
- All P1 findings closed; no security/privacy/payment P1 may be accepted merely because beta traffic is low.
- TASK-021 signed launch rehearsal.

### Should — V1.1 immediately after or before broad acquisition

- TASK-014 accessible dialogs.
- TASK-015 relational/transactional hardening.
- TASK-016 cover upload hardening.
- TASK-017 explicit template availability.
- TASK-018 safe social previews.
- TASK-019 packaging/landing experiment.

### Can — when regression safety exists

- TASK-020 incremental decomposition and typed localization.
- Coverage budgets, design-system documentation, support playbooks.

### Future — only after beta evidence

- TASK-022 object storage and managed messaging decision.
- QR check-in, seating planner, automated reminders, collaborator roles, custom domains, concierge design packages.

---

## 14. MVP, V1.1, and V2 scope

### Commercial MVP (exact scope)

- Arabic/English landing and six selectable authored templates.
- One event per purchase with explicit activation/end rules.
- Secure signup/login/recovery.
- Create/edit/publish event; schedule, map, story, cover, music opt-in.
- Guest add/import, groups/segments, general and tokenized personalized links.
- Secure public/self-registration RSVP and tokenized managed-guest updates.
- Manual WhatsApp link handoff—clearly not automated delivery.
- EGP plans from one catalog; manual transfer evidence and admin approval.
- Privacy/terms/refund/support operations, final domain, monitoring, analytics, backup restore, and E2E launch suite.

Anything not in that list is not required to launch.

### V1.1

- Accessible shared dialogs and stronger upload/data invariants.
- Safe event-sharing previews.
- Improved admin support/reconciliation tools.
- Shorter conversion hierarchy informed by funnel data.
- Typed localization and targeted component/data-layer decomposition.
- Real, permissioned customer proof.

### V2 candidates, validated by demand

- Approved WhatsApp Business automation and reminders.
- QR check-in and event-day guest operations.
- Seating plan only if customer interviews show high willingness to pay.
- Multi-collaborator roles and planner/agency workflow.
- Premium concierge/custom design tier.
- Object storage/CDN after measured media thresholds.
- Custom domains only if support/security cost is justified.

### What not to build now

- Native iOS/Android apps.
- AI invitation generation, avatars, or 3D effects.
- A general-purpose Canva-like editor.
- Microservices or a new database.
- Full email-marketing automation.
- QR scanners, seating, registries, gifts, vendor marketplace, or guest chat merely because competitors list them.
- Unapproved WhatsApp automation or scraping.
- More template count before the existing 6/12 catalog truth is resolved and conversion data identifies demand.

---

## 15. Launch Definition of Done

A paid public launch is “done” only when all items below have dated evidence and an accountable owner.

### Security and privacy

- [ ] SEC-001 exploit regression tests pass, including concurrency and cross-event attempts.
- [ ] Dependency audit has zero high/critical production findings, or a written time-bounded expert risk acceptance.
- [ ] Invitation pages are noindex by default; tokens/guest PII never reach metadata, analytics, or logs.
- [ ] Upload and rate/abuse controls pass malicious fixtures.
- [ ] Secrets, admin permissions, ownership, and production headers are rechecked.

### Product and commerce

- [ ] Landing, checkout, seed, API, invoice/receipt copy, and entitlements show the same approved prices/limits.
- [ ] Signup → create → publish → share → RSVP passes on Arabic/English mobile and desktop.
- [ ] Every manual-payment state passes with two reviewers and exact entitlement results.
- [ ] WhatsApp and email claims match actual delivery capability.

### Reliability and operations

- [ ] Final domain, TLS, canonical, auth callbacks, and environment separation pass.
- [ ] Backup restore drill meets approved RPO/RTO.
- [ ] Monitoring detects synthetic health/auth/RSVP/payment failures and routes an alert.
- [ ] Rollback is rehearsed without data loss.
- [ ] Support, payment reconciliation, refund, privacy-request, and incident owners are reachable.

### Quality and experience

- [ ] Critical E2E suite passes three consecutive clean CI runs.
- [ ] Mobile lab LCP meets ≤3.0 s guardrail; CLS ≤0.1; field collection enabled.
- [ ] No horizontal overflow at 320–1440 px; 375/768/1280 visual captures approved.
- [ ] Core dialogs pass keyboard/focus/axe checks.
- [ ] No broken resources or unexpected console errors on public/auth/invitation critical pages.

### Legal and business

- [ ] Egyptian legal/accounting review is complete for privacy, consumer, refund, business, tax, and invoice/receipt obligations.
- [ ] Data inventory, retention, access, correction, deletion, and account/event closure are operational.
- [ ] Pricing/packaging and final offer are owner-approved.
- [ ] Go/no-go packet is signed; unresolved risks have owner, deadline, and explicit acceptance.

---

## 16. Final recommendation

Keep the product’s visual identity, invitation craft, bilingual treatment, and segment-level guest model. They are the strongest assets. Spend the next release cycle on integrity, commercial truth, runtime proof, telemetry, recovery, privacy, and final-domain operations. Run a small controlled beta while those items close, with open RSVP disabled or constrained if TASK-001 is not yet deployed and with paid acquisition off until TASK-021 passes.

The winning strategy is not “more wedding features.” It is making the existing experience trustworthy enough that an Egyptian couple can pay in EGP, publish confidently, share through WhatsApp, and know that every guest sees the right invitation and every RSVP remains correct.

---

## 17. Source register

### Product/repository evidence

- Repository source, tests, migrations, release/acceptance documents, lockfile, and configuration as inspected on 2 September 2026.
- Production application and `/api/health`: [wisal-self.vercel.app](https://wisal-self.vercel.app).
- CI evidence: [GitHub Actions run](https://github.com/Kerolos17/wisal/actions/runs/33258613361).

### Standards and official guidance

- [Google web.dev — Largest Contentful Paint](https://web.dev/articles/lcp)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Egypt Personal Data Protection Center](https://www.pdpc.gov.eg/)
- [Egypt Consumer Protection Agency legislation](https://cpa.gov.eg/ar-eg/%D8%AA%D8%B4%D8%B1%D9%8A%D8%B9%D8%A7%D8%AA)
- [Egyptian Tax Authority e-invoice guidance](https://www.eta.gov.eg/ar/content/e-invoice-services)

### Competitor primary sources

- [Da3wa](https://www.da3wa.app/?lang=en)
- [Farhena](https://www.farhena.com/)
- [Daawah](https://daawah.app/)
- [INVE](https://app.inve.services/en)
- [Waraqa](https://www.waraqa.digital/waraqa)
- [Lumaro](https://www.lumarodigital.com/)
- [invitationJo](https://www.invitation-jo.com/)
- [Greenvelope](https://www.greenvelope.com/wedding-invitations)
- [Paperless Post pricing](https://www.paperlesspost.com/pricing)
- [Joy pricing](https://withjoy.com/pricing/)
- [Canva wedding invitations](https://www.canva.com/create/wedding-invitations/)

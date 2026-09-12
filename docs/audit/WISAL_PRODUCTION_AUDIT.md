# Wisal Production Readiness Audit

## 1. Executive summary

**Production readiness: 58% — conditionally beta-ready, not ready for a public paid launch.**

Wisal has a credible, unusually complete product foundation: a deployed English-first public surface, a coherent premium visual direction, email/password and Google entry points, Neon/Postgres + Drizzle data model, role-gated administration, personalized guest links, segment-aware RSVP, manual payment review, CI, health monitoring, security headers, noindex private invitations, and Sentry wiring. The local production build, TypeScript check, lint, and 179 static/contract tests all passed at the audited revision.

The launch risks are concentrated rather than architectural: the Google account-linking journey is intentionally unsupported by the current provider integration; persisted defaults still create Arabic-first records despite the English-first requirement; message scheduling does not deliver messages; production configuration and real authenticated flows have not been proven end-to-end; and primary-database blob storage will become a reliability/cost concern as photos and receipts grow. These can be fixed incrementally. A rewrite is not justified.

### Evidence and limitations

- Reviewed source, schema, migrations, Vercel/GitHub configuration and live public application at `https://wisal-self.vercel.app/`.
- Live homepage and sign-in rendered correctly in English; unauthenticated workspace redirected to sign-in; template selection updated the live preview.
- `node --env-file=.env.example --test tests/*.test.mjs`, `tsc --noEmit`, and production build passed: 179/179 contract tests.
- The bundled Playwright production smoke suite could not execute in this audit container because its browser binary was absent, and an unauthenticated browser session cannot validate private owner/admin flows. These are explicit release-gate gaps, not product failures.
- No user data, credentials, production settings, payment, database content, or deployment state was altered.

## 2. Current architecture

See [WISAL_ARCHITECTURE.md](WISAL_ARCHITECTURE.md). The verified stack is Next.js 16/React 19, Neon Auth, Neon PostgreSQL/Drizzle, CSS-based design system, PostgreSQL blob storage, Vercel deployment, GitHub Actions CI/health checks, and Sentry wiring.

## 3. Existing features

| Complete / substantially implemented | Partial / needs proof | Broken or launch-incomplete | Missing |
|---|---|---|---|
| Public landing, template catalog, privacy/terms, English UI default, LTR/RTL switch, email/password entry, password-first Google recovery/linking handoff, workspace gate, event CRUD, templates/opening settings, segments, groups, CSV import/export, tokenized guests, RSVP, invitations, admin roles/overview, support, notifications, manual payments, audit log, robots/sitemap/CSP | Google OAuth new-account flow, account creation/reset delivery, full negative API authorization matrix, private invite server enforcement in production, admin roles, mobile/Safari behavior, real Sentry delivery, actual health-monitor success, payment receipt review, subscription entitlement | Scheduled messages do not send; schema/service defaults persist Arabic-first values | Email/WhatsApp provider integration and delivery worker, verified analytics/consent setup, deletion/export workflow, public observability dashboards, immutable operational audit for all sensitive user actions |

## 4. Production blockers (P0)

1. **WIS-003 — Prove production authorization and core journeys with controlled identities.** A controlled check confirmed distinct accounts and owner-scoped code, but launch cannot rely on source assertions for every cross-tenant API substitution, token privacy, callback behavior, or payment entitlement.
2. **WIS-004 — Verify production auth/secret/callback/cookie configuration.** Configuration is deliberately unavailable to code review; launch must not proceed until the checklist records pass/fail evidence.

## 5. Critical issues (P1)

- **WIS-002:** make English the default in persisted account/event/invitation fallbacks and localize API errors through a common code system.
- **WIS-005:** clarify and implement message delivery. Current `scheduled` state is a manual follow-up queue, not WhatsApp/email automation.
- **WIS-006:** protect database performance/backups from growing blob traffic; introduce object-storage decision and retention policy.
- **WIS-007:** harden media validation and processing.
- **WIS-008:** publish privacy lifecycle, data export/deletion support, retention, and PII observability rules.
- **WIS-009:** split the page/studio/dashboard client module and establish reusable design primitives to lower regression risk.
- **WIS-010:** execute measured mobile, browser and performance QA baselines.

## 6. UI/UX audit

See [WISAL_UI_UX_AUDIT.md](WISAL_UI_UX_AUDIT.md). Key conclusion: the visual direction is differentiated and marketable. Focus the next cycle on journey clarity, safe onboarding, English data defaults, composable dashboard/studio code, high-confidence mobile rendering and real delivery expectations—not a home-page rewrite.

## 7. Security audit

See [WISAL_SECURITY_AUDIT.md](WISAL_SECURITY_AUDIT.md). No critical source-level injection/access-control defect was confirmed. The highest remaining risk is unproven production behavior: identity linking, tenant boundaries and real environment settings. This distinction matters: do not weaken access controls simply to make a demo flow pass.

## 8. Performance audit

### Verified positives

- Next production build succeeds; static public home and legal routes are pre-rendered.
- Self-hosted fonts and local branded assets reduce third-party dependency risk.
- Invitation metadata keeps private pages out of search, and public handlers use no-store where appropriate.
- Animation options include skip and reduced-motion contracts.

### Risks / actions

| Finding | Impact | Action |
|---|---|---|
| Hero/template imagery and large client `app/page.tsx` surface | LCP/INP risk, especially on mobile | Establish route JS/image budgets; profile mobile home/studio; split heavy views and defer non-critical assets |
| Binary covers/receipts in PostgreSQL | DB growth, base64/response overhead, slower backup/restore | Measure current volume; move to signed object storage before scale |
| No audited field data/Lighthouse baseline | Cannot claim Core Web Vitals readiness | Record mobile/desktop Lighthouse and RUM; target LCP ≤2.5s, INP <200ms, CLS <0.1 per Google guidance.[^1] |
| No Three.js dependency today | Positive | Keep it absent until a feature passes a mobile performance budget; prefer CSS/GSAP |

## 9. Mobile audit

CSS and tests explicitly address responsive navigation and preview, but this audit could not run the repository’s mobile Playwright project. Required test widths are 320, 360, 375, 390 and 430 px plus tablet. Highest-risk surfaces: fixed bottom navigation versus modal CTA, studio preview, guest tables/CSV import, long Arabic/English names, cover cropping and invitation opening on low-memory Android.

## 10. Authentication audit

| Area | Finding | Status |
|---|---|---|
| Email/password | Form, recovery route, provider handler and protected redirect exist | Runtime email delivery/verification and rate limiting unverified |
| Google OAuth | Button posts to provider social endpoint and returns to `/auth/callback` | Existing password account linking is not supported; P0 |
| Callbacks | Local `safeReturnPath` rejects open redirect forms | Actual provider callback/state allowlist must be exercised |
| Sessions | Neon Auth server session and cookie secret are configured by env | Cookie flags/expiry/revocation need deployed verification |
| Logout | Route exists | Verify it invalidates session and clears client state |
| Authorization | Owner-scoped services and role matrix exist | Must prove negative tests with multiple real test identities |

## 11. Database & API audit

The relational model is appropriate for the product and has good constraints/indexes. Foreign keys, UUIDs, unique guest tokens and payment state versioning are strengths. Required changes are targeted: English default migration; centralized validation limits; migration/object-storage plan; page-level pagination for admin/event lists; and multi-identity endpoint tests.

Sensitive route review uses the expected order: identity → owner/role → request validation → business rule → data operation. The public RSVP/open routes additionally use token validation, bounded input, origin checks and shared rate limiting. Continue this pattern for every new endpoint.

## 12. Invitation system audit

Six live catalog directions are visibly distinct and the underlying system supports envelope/card/curtain openings, classic/story/cinematic layouts, cover art, selective sections, locale and reduced-motion behavior. This is sufficient for an initial premium catalog.

Before launch, prove that the editor preview and public invitation render the same choices, all templates preserve contrast on real covers, failed media has a graceful state, private/event-segment access is server-enforced, and guests can skip every opening. Do not add a general Three.js layer; it adds risk without an identified job that CSS/GSAP cannot perform.

## 13. Guest / RSVP audit

Implemented capabilities include guests, phone numbers, party size, group membership, segment access, personalized UUID links, engagement tracking, CSV import/export, manual WhatsApp-ready queues and per-segment RSVP. The guest-group model supports the church/reception use case.

Open decisions: public RSVP identity policy, editing a submitted response, couples/families/plus-one semantics, delivery ownership, and deletion/retention. WIS-003 must verify hidden segments cannot be recovered from API/source by token substitution.

## 14. Dashboard audit

The user dashboard has the right functional vocabulary: invitation status, guests, RSVP states, recent activity, segments/groups, messages and support. Improve it by prioritizing three actions for new users: finish details, add guests, publish/share. The Admin area is appropriately server-gated and role-matrix based, but needs volume handling (pagination/search), action confirmation and operational data tests.

## 15. SEO, accessibility and privacy

Public platform metadata, canonical URL, OG/Twitter metadata, manifest, sitemap and robots are present. Invitation routes are intentionally noindex/nofollow/no-referrer, and sitemap excludes them. Verify the deployed canonical host from the real production domain during launch.

Accessibility controls exist but need manual validation: focus, modal behavior, contrast, semantics, reduced motion and RTL. Privacy needs a written lifecycle for guest/contact/receipt data and a supportable deletion/export flow before paid public launch.

## 16. Missing product features

| Must have | Should have | Nice to have | Post-launch |
|---|---|---|---|
| Safe auth recovery/linking; proven tenant isolation; truthful delivery behavior; privacy lifecycle; production observability | Provider-backed WhatsApp/email delivery with opt-in, delivery status and retries; edit RSVP policy; pagination; stronger media pipeline | Family/couple guest types, tags, reusable message templates, richer reports | Advanced analytics, custom domains, automated reminders, billing gateway, feature flags, A/B testing |

## 17. Recommended architecture improvements

1. Extract page views into route-aware feature modules while preserving existing APIs and visual behavior.
2. Keep the relational authorization model; add a multi-identity E2E harness rather than replacing it.
3. Move binary files from PostgreSQL to managed object storage only after migration, integrity, private/public access and rollback design are approved.
4. Add an outbound-message adapter with explicit provider, consent, rate-limit, idempotency, retry/dead-letter and audit boundaries; do not fake automated sends with database statuses.
5. Add a locale/domain migration that preserves existing Arabic records but gives all new records English-default semantics.

## 18. Launch checklist

Use [WISAL_LAUNCH_CHECKLIST.md](WISAL_LAUNCH_CHECKLIST.md) as the release gate.

## 19. Implementation roadmap

The detailed source of truth is [WISAL_IMPLEMENTATION_ROADMAP.md](WISAL_IMPLEMENTATION_ROADMAP.md).

## 20. Final recommended backlog

The backlog, priorities, dependencies and acceptance criteria are maintained in [WISAL_IMPLEMENTATION_ROADMAP.md](WISAL_IMPLEMENTATION_ROADMAP.md#prioritized-backlog).

## References

[^1]: Google Search Central, [Understanding Core Web Vitals and Google search results](https://developers.google.com/search/docs/appearance/core-web-vitals), accessed September 2026.

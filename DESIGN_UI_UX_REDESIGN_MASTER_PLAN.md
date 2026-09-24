# Design & UI/UX Redesign Master Plan — Wisal

**Audit date:** 24 September 2026 · **Repo:** `E:\wisal` @ main (post Phase 7, 196/196 tests)
**Method:** source inspection (3 CSS systems, `app/page.tsx` 1446-line shell, `InvitationClient.tsx`, 12 concepts) + production-server browser shots (landing 1440/390 EN+AR, sign-in, workspace, 3 previews) + live competitor research.
**Rule:** audit first, no app code changed. Authenticated dashboard/admin assessed via code (no credentials); stated where NOT VERIFIED visually.
**Prior decision (binding):** Atelier Wisal is the single visual direction (impeccable seed `b17b8bec`, Phase 1). This plan consolidates toward it — it does NOT propose a new direction.

**Execution status (24 September 2026): ALL D-PHASES MERGED** — D-1 tokens (#13) · D-2 public site incl. `?lang=` fix (#14) · D-3 dashboard/studio (#15) · D-4 twelve-world catalogue (#16) · D-5 motion tokens (#17) · D-6 digit rule + AA lock (#18). Main: 213/213 tests green. Remaining: manual gates (domain, E2E secrets, drills, payment dual-review, legal counsel).

---

## 1. Executive Summary

Wisal looks better than its reputation: the atelier landing hero and the velvet-night invitation are genuinely premium (screenshot-verified). The real disease is architectural, not aesthetic: **three CSS systems load simultaneously** (`globals.css` 256KB + `wisal-atlas.css` 43KB + `wisal-atelier.css` 34KB) with **competing token definitions** (atelier redefines `--plum/--rose/--ivory`), **15+ border-radius values**, **two parallel animation families** (`atlas-*` + `atelier-*`), and a **1446-line single-file page shell**. The product reads as "designed at different times" because it literally was. Dashboard styling is thin (5 dedicated classes) and generic next to the emotional invitation craft. Two functional UX bugs were proven: `?lang=ar` deep-links are ignored on landing (`useWisalLocale()` called without the `"lang"` key — `app/page.tsx:350` vs `InvitationClient.tsx:97`), and the landing gallery + hero swatches expose only 6 of 12 concepts.

The market (Aveilia, The Royal Invite, Snap Post, TheDigitalYes 2026 guide — researched today) converges on one lesson: **luxury = restraint + living invitations, not screenshots**. Wisal already owns the differentiator (real preview routes, per-segment scoped invites) but under-presents it.

**Strategy in one line:** consolidate to one token system under the approved atelier direction → systematize dashboard as "calm operations" in the same language → give each of the 12 concepts a distinct identity contract → standardize motion as CSS-only tokens → fix the proven UX gaps. No new animation libraries. No rewrite.

---

## 2. Current Design Assessment

| Layer | Verdict | Evidence |
|---|---|---|
| Landing hero (atelier) | Strong — keep | screenshot 1440/390: balanced split, clear CTA hierarchy, 54px targets, CLS 0 |
| Invitation craft (velvet/garden/coastal) | Strong — keep | screenshots: distinct palettes, typography, mood per concept |
| Token architecture | Broken — consolidate | 3 files, `--plum` redefined, `--atlas-*` aliased to atelier vars |
| Radius/spacing | Ad hoc — systematize | 15+ radius values; no spacing scale |
| Motion | Decent but dual — unify | 20 keyframes across two families; CSS-only (good); 60s countdown tick |
| Dashboard | Generic — elevate | 5 CSS classes; single-file shell; flattened modal eyebrows |
| RTL | Good foundation — finish | dir flip + `[dir=ltr]` overrides + Arabic fonts; `?lang=` broken on landing; mixed digits |
| Gallery/discovery | Under-presented — expand | 6/12 concepts showcased; 64px swatches; no live-opening demos |

---

## 3. Visual Quality Problems

- **VQ-001 (P0, Design System): triple CSS system.** `app/layout.tsx` imports `globals.css` + `wisal-atlas.css` + `wisal-atelier.css`. Atelier overrides base tokens (`--plum: var(--atelier-aubergine)` at `wisal-atelier.css:228`). Any future edit risks cascade surprises. WHAT: merge into one layered file with explicit layers (`@layer base, atelier, components, utilities`) and one token source. VERIFY: computed-style audit + 196 tests + screenshots.
- **VQ-002 (P1, UI): radius anarchy.** 0/2/3/4/6/9/10/11/12/13/14/15/16/50%/999px + arch shapes (`100px 100px 0 0`, `120px...`) + `!important` overrides. WHAT: 4-step scale (6/12/20/full) + arch reserved for invitation openings. WHERE: all cards/modals/buttons.
- **VQ-003 (P1, UI): hero CTA redundancy.** Nav shows Sign in + Create; hero shows Design + Browse + assurance line = 4 competing actions. WHAT: nav keeps Create only (Sign in moves to overflow on mobile); hero keeps Design primary + Browse secondary. WHY: first-viewport attention test — eye goes to lime button, good, but nav duplicates the decision.
- **VQ-004 (P2, UI): 64px gallery swatches** too small to judge designs (`app/page.tsx:660`). WHAT: ≥96px with name labels; gallery 6→12 (already expanded in showcase list Phase 6 — extend to swatch UI + landing gallery section).
- **VQ-005 (P2, UI): modal eyebrows removed** across 5 modals (CreateEvent/Guest/Group/Import/Message/WhatsApp) — flattened hierarchy, harder scanning. WHAT: restore single eyebrow style (already restored for attendance in Phase 1; apply same treatment).
- **VQ-006 (P3, UI): mixed-locale date artifact** — EN date inside AR preview (preview fixture data + default EN locale). WHAT: preview fixtures carry both locales; document that guests see their own locale.

---

## 4. UX Problems

- **UX-001 (P1): `?lang=ar` ignored on landing.** `useWisalLocale()` without key (`app/page.tsx:350`); invites use `"lang"`. Shared Arabic links land in English. WHAT: pass `"lang"` on landing too; persist choice; add `<html lang>` correctness test. VERIFY: fresh-context screenshot with `?lang=ar` renders Arabic.
- **UX-002 (P1): dashboard navigability by code review.** Single-file shell with section switcher (overview/guests/messages/notifications/support/activity/settings); launch-readiness + stat-grid + segment-analytics + donut is a sound IA, but empty states exist only for groups/WhatsApp queue. WHAT: add empty states for guests/messages/activity + skeleton loaders for overview stats. NOT VERIFIED visually (no creds) — mark runtime check required.
- **UX-003 (P2): auth pages uninspectable; sign-in redirects when provider off** (`app/auth/sign-in/page.tsx:12`). WHAT: design explicit provider-off state instead of silent redirect; add auth error/recovery copy review.
- **UX-004 (P2): countdown ticks every 60s with no transition** — digits jump. WHAT: 300ms digit crossfade (motion token `motion-fast`).
- **UX-005 (P3): no guest language picker on open** (Royal Invite pattern). WHAT: V1.1 — locale toggle already exists in invite controls; surface it in the opening screen.

---

## 5. Color System Audit

Current: base (`--plum #241329, --rose #c98779, --ivory #f8f3ef, --sage, --gold #b58a4c`), premium-dark (`--canvas-premium #160d19, --gold-premium #d5ae6c`), atelier (`lilac #d8c5ec, porcelain #fbf9fc, aubergine #432846, lime #d8ff6d`) + countdown/contextual `color-mix` derivatives. Conflicts: `--plum/--rose/--ivory/--muted/--line` mean different things per file; success/warning/error semantics scattered; chartreuse lime used for primary CTA + accents + shadows interchangeably.

**DS 2.0 color (adopt):** `--bg, --surface, --surface-raised, --ink, --ink-muted, --line, --line-soft, --brand (aubergine), --action (lime, CTA-only), --gold (celebration accents only), --success/--warning/--error/--info` + per-concept invitation palettes keyed by concept code (12 entries, already distinct in previews — codify). Rule: lime NEVER for text/decoration, only primary actions; gold NEVER for UI chrome, only invitation celebration moments.

---

## 6. Typography Audit

Fonts (self-hosted, good): IBM Plex Sans Arabic (UI AR), Noto Naskh Arabic (display AR), Manrope (UI EN), Cormorant Garamond (display EN) — pairing is correct luxury/editorial. Problems: no codified scale (ad hoc sizes in components); Arabic display at large sizes needs tighter line-height than Latin (Naskh ascenders); invitation names mix Cormorant (EN) with system fallback for Arabic names — define Arabic display sizing +2–4px vs Latin optical equivalent.

**Type scale (adopt):** display 40/32/28 (clamp mobile), h1 32/28, h2 24/22, h3 20, body 16/15, small 14/13, caption 12; line-height 1.15 display / 1.4 headings / 1.7 body; AR display +0.1 line-height. WHERE: tokens `--font-*` + `--text-*`.

---

## 7. Spacing & Layout Audit

No scale enforced. Adopt 4pt base: `4/8/12/16/20/24/32/40/48/64/80/96`; section rhythm 64 desktop / 40 mobile; card padding 20/24; dashboard grid gap 16/20. Containers: marketing 1200, app 1280, invite 480 (mobile-first reader). Grid: 12-col marketing, dashboard 3+9 (nav+content), invite single column always.

---

## 8. Component Audit

Buttons: `.atlas-primary` (lime), `.primary`, `.ghost`, `.danger-button`, `.text-button`, `.reminder-button`, `.copy-message` — 7 variants, overlapping roles. Inputs: native in `.form-grid` (consistent, good). Modals: `.modal-backdrop > .create-modal (+guest/group/import/message/whatsapp/segment variants)` — consistent shell, eyebrows stripped (VQ-005). Cards: stat cards, group-cards, template minis, message articles — 4 systems, unify to `card` + `card-raised`. Tables: guest table (code-reviewed, NOT VERIFIED visually). States: loaders (`BuilderLoading`, spinners `auth-spin/builder-spin`), empty (`empty-tool` ×2 surfaces only), errors inline (`form-error`) — extend empty/skeleton coverage (UX-002).

---

## 9. Design System Audit

No single source of truth (see §3 VQ-001). Recommended architecture: `tokens.css` (color/type/space/radius/motion/elevation) → `base.css` (reset, RTL, reduced-motion, focus) → `components.css` (buttons/forms/cards/modals/tabs/tables/badges) → `atelier.css` (marketing) → `invite.css` (per-concept identities) → `dashboard.css` (operations language). Migration is mechanical (move, don't rewrite) — Phase 1 of implementation.

---

## 10. Public Website Audit

Hero: keep composition; fix CTA redundancy (VQ-003), swatch size (VQ-004), `?lang=` (UX-001). Workflow strip: keep 3 steps; sharpen step 3 copy (done Phase 6). Gallery: expand to 12 with ≥96px cards + live-preview links (routes already exist). Pricing: honest (Phase 6 reframe done); add validity + refund microcopy (needs legal). Trust: add "how sharing works" strip + labeled illustrative demo (no fake testimonials). Footer: keep; add status/health link (ops transparency).

---

## 11. Dashboard Audit

Design language "Calm Operations": porcelain surfaces, aubergine ink, lime reserved for the single primary action per view, gold never. Card system: stat (metric+delta), panel (tool), list (guest/message rows). Navigation: keep section switcher; add breadcrumbs for event context on mobile. Hierarchy: launch-readiness → stats → per-stage → guests/messages. Gaps: empty states (guests/messages/activity), skeletons, 44px targets on table actions (verify runtime). Must visually echo invitations via concept-tinted event header (couple names in invitation display font).

---

## 12. Invitation Experience Audit

Opening (envelope/card/curtain): keep, distinct per concept mapping exists. Content order configurable (sectionOrder) — good. RSVP per-stage: keep interaction, add digit crossfade (UX-004). Utilities (save-date/share/music): keep icon+label buttons. Privacy line: keep. Countdown zeros-flash on load (hydration fix side effect): acceptable, or skeleton shimmer — choose shimmer in implementation. Cover images via `/api/media` (UUID keys) — add blur-up placeholder (LQIP via next/image `placeholder=blur` with tiny blurDataURL per concept).

---

## 13. Template-by-Template Audit

| Template | Strengths | Problems | Direction | Priority |
|---|---|---|---|---|
| love-poem (Élan Editorial) | editorial arch, cotton mood | default fallback for unknown names (hides mapping gaps) | keep + log unknown-name mapping | P2 |
| garden-night (Garden Reverie) | watercolor identity, story layout | — | keep | P3 |
| moonlight (Glass Moon) | glass/translucent calm | — | keep | P3 |
| golden-vows (Gilded Promise) | royal seal, champagne | shares `royal` art with cathedral-light | differentiate seal vs chapel motif | P2 |
| white-story (Still) | minimal, names-first | — | keep | P3 |
| cinema-night (Afterglow) | cinematic curtain, full-bleed | heaviest assets | budget + lazy below-fold | P1 |
| rose-garden (Blush Botanica) | botanical distinct from garden-night? | close to garden-night (both sage/botanical) | push blush/pastel vs garden deep-green | P1 |
| cathedral-light (Royal Chapel) | chapel vs seal potential | shares royal art | architectural arch motif, cooler stone palette | P2 |
| desert-sunset (Sunlit Pages) | editorial art shared w/ love-poem | shares `editorial` art | sunlit gradient wash, distinct opening moment | P2 |
| velvet-night (Velvet Première) | stunning dark luxe (verified) | — | flagship dark concept, keep | P3 |
| coastal-breeze (Barefoot Vows) | light coastal calm | — | keep | P3 |
| modern-monogram (Noor Monogram) | monogram identity | newest, least proven | keep + gather feedback | P2 |

No template deprecated: weakest pairs (garden/rose, golden/cathedral, love/desert) get motif separation, not removal.

---

## 14. Invitation Template System (framework)

Each concept gets an identity contract file: `{ palette, displayFont pairing, decorativeMotif, imageTreatment, openingStyle, motionVariant, sectionOrder default, mobileRules }`. Renderer maps concept→contract (replacing scattered `publicTemplateArt` + ad hoc conditionals). New concepts = new contract, never conditional sprawl. `resolveInvitationConcept` fallback logs (not silent).

---

## 15–19. Motion Audit, Technology, System, Mobile, Safety

Current: 20 CSS keyframes, two families, no JS libs — **keep CSS-only** (no Framer Motion/GSAP: unjustified weight for this product; 60s-tick countdown and reveal animations don't need them). Unify: retire `atlas-*` keyframes or alias to atelier equivalents; one family `invite-*` + `ui-*`.
Tokens: `--motion-fast 160ms, --motion-base 280ms, --motion-slow 480ms, --motion-cinematic 900ms; --ease-out cubic-bezier(.22,.9,.28,1), --ease-spring cubic-bezier(.34,1.4,.4,1) (UI only, never text), --stagger 60ms`.
Principles: one hero animation per surface (digitalyes rule); entrances rise 12px+fade; exits fade only; ambient (bloom/shimmer) ≤1 per viewport; countdown digit crossfade 160ms; reduced-motion: all become opacity-only or none (already 3 guards — extend to new tokens); mobile: disable parallax/blur, keep transforms (GPU), 60fps budget, battery-safe (no infinite heavy loops on low-end).

---

## 20. Responsive Design System

Breakpoints: 360 (small), 480 (invite max), 768 (tablet), 1024 (desktop), 1280 (wide). Verified 320–1440 zero-overflow (Phase 7) — lock with visual regression on hero/gallery/dashboard/invite. Invite: single column always, 480 container centered on desktop with ambient backdrop. Dashboard: side nav ≥1024, bottom/context nav below. Tables → cards below 768. Modals full-sheet below 480.

---

## 21. RTL / Arabic Audit & Strategy

Foundation good (dir flip, `[dir=ltr]` overrides, Arabic fonts, localized validation). Gaps: `?lang=` landing (UX-001 P1); digit inconsistency (Arabic-Indic in copy vs Western in stats/dates) — adopt: dates Western digits with Arabic month names (readability-tested convention), counts Arabic-Indic in prose, tabular Western in tables; animation direction: curtain/reveal mirrored via logical properties (use `margin-inline/start/end`, never left/right in new code); icons: arrows flip (already `←/→` swap — codify rule); decorative calligraphy must not mirror (art stays LTR-composed).

---

## 22. Competitor Research (24 Sept 2026)

- **Aveilia** (aveilia.com): 18 designs, tap-to-watch full opening reveals, $99 one-time, private couple dashboard. Lesson: sell openings as video-like demos.
- **The Royal Invite** (theroyalinvite.com): 5 "different worlds", LIVE working invitations (not screenshots), guest language picker on open, 72h delivery. Lesson: live > screenshots; per-guest language choice.
- **BEZIAI** (beziai.com): WYSIWYG studio, 20+ blueprints, 11 cinematic openings. Lesson: editor power (Wisal counters with simplicity).
- **Snap Post** (snappost.co): restraint doctrine — type scale, margins, single framing motif. Lesson: codify restraint.
- **TheDigitalYes guide** (thedigitalyes.com, Apr 2026): animate ONE thing; custom domain signals bespoke. Lesson: motion budget + domain (matches DOM-001).
- **MENA:** Invitou/fr7y/Zeekraa (prior audit) — craft perception is the bar; Wisal's atelier already meets it.

---

## 23. Design Benchmarks

| Area | Wisal now | Market pattern | Recommended |
|---|---|---|---|
| Typography | good pairing, no scale | restrained scales, display serif | codify scale §6 |
| Color | 3 competing systems | single semantic + concept palettes | DS 2.0 §5 |
| Spacing | ad hoc | 4/8pt scales | §7 scale |
| Navigation | section switcher ok | event-context breadcrumbs | add breadcrumbs |
| Dashboard | generic cards | private calm dashboards (Aveilia) | §11 language |
| Invitations | strong, 12 distinct-ish | live demos, one hero animation | live gallery + motion budget |
| Mobile | verified 0-overflow | mobile-first invites | lock regression |
| Motion | dual CSS families | one restrained system | §15–19 tokens |
| Onboarding | 5-step studio, clear | 3-step + concierge | keep 5, sharpen copy |
| CTA | lime, redundant | single primary | VQ-003 fix |

---

## 24. Design Direction (confirmed, not new)

Feel: composed, personal, calm; aubergine ink on porcelain/lilac; lime reserved for action; Cormorant+Naskh display voices. NOT: generic SaaS, marketplace, noisy, childish, over-decorated. This matches the approved atelier direction — the plan implements it consistently rather than re-deciding it.

---

## 25. Design System 2.0

Tokens file (new `app/design/tokens.css`): colors §5, type §6, space §7, radius (6/12/20/full + arch exception), elevation (soft 24px/16% aubergine; raised; none on invites), motion §17. Components: Button (primary lime/ghost/danger/text — merge 7→4), Field (keep form-grid), Card (stat/panel/row), Modal (shell + eyebrow restored), Tabs, Table→cards rule, Badge (status colors), Skeleton, Empty, Toast. Invite identities: 12 contracts §14. All RTL-logical, reduced-motion-safe, 44px targets.

---

## 26. Information Architecture

Marketing: Home (hero/gallery/workflow/pricing/trust/FAQ) / Designs (/invite/preview/*) / Pricing / FAQ / Privacy / Terms. App (auth-gated): Workspace (events) → Event (overview/guests/messages/activity/settings) → Studio (5 steps) → Checkout. Admin: Overview/Users/Templates/Plans/Content/Support/Payments (existing). Public: /invite/[slug] (+ preview). No restructure needed — IA is sound; fix wayfinding details (breadcrumbs, empty states).

---

## 27. Page-by-Page Redesign Plan

- **Landing:** VQ-003/004, UX-001 fixes; gallery 12; trust strip; pricing microcopy (pending legal). Priority P1. Success: CTA click clarity + 0-overflow (have) + AR deep-link works.
- **Auth (sign-in/up/recovery):** explicit provider-off state; copy/contrast pass; RTL forms; loading/error states. P2 (NOT VERIFIED visually — runtime check required).
- **Workspace/Dashboard:** §11 language; empty states; skeletons; breadcrumbs; concept-tinted header. P1. Success: task completion without guidance.
- **Studio (5 steps):** keep flow; unify step header/progress; template grid 12 with filters; sticky live phone preview (exists — keep). P2.
- **Checkout/status:** plan reframe (done); receipt upload states; support link. P2 (needs payment ops).
- **Admin:** density + table consistency; role-aware nav. P3.
- **Invite (all concepts):** §13 per-concept deltas; shimmer countdown load; blur-up covers. P1.
- **Preview routes:** gallery links; keep noindex. P2.

---

## 28. Component Plan (priority order)

Button unify (7→4) · Modal eyebrow restore · Card unify · Empty/Skeleton rollout · Table responsive rule · Badge semantics · Tabs (studio filters) · Toast (replace ad-hoc feedback) · Phone-preview frame (standardize) · Swatch (≥96px + labels).

---

## 29. Invitation Roadmap

Per §13 table. Motif separations (garden/rose, golden/cathedral, love/desert) P1–P2; cinema asset budget P1; monogram feedback loop P2; rest P3 keep. None deprecated.

---

## 30. Motion Storyboards

Landing hero: copy stagger 60ms → preview rise+fade → swatch(parallax none) → CTA pulse-once. Opening: seal/curtain 900ms ease-out → names rise → ornament bloom (single ambient). Scroll: section fade-rise, image clip-reveal, countdown shimmer→live. RSVP: option select spring → submit 280ms → success check draw. Dashboard: stat count-up (respect reduced-motion), panel fade. All mobile: transforms only, ≤480ms except cinematic opening.

---

## 31. Performance Budget

Images: hero ≤150KB delivered (have 13KB WebP ✓); covers ≤300KB w=1080; previews lazy below fold. Fonts: 4 families max (have), `font-display: swap`. JS: no animation libs (keep 0). CSS: single layered bundle target <60KB gz (from ~333KB raw today). Animations: ≤2 concurrent infinite; countdown 60s tick. Invite LCP <2.5s 4G lab; field trace V1.1.

---

## 32. Restraint Rules (DO NOT)

No new gradients beyond concept art; no glassmorphism in dashboard; shadows only soft/raised; ≤1 ambient animation/viewport; no 3D/WebGL; no parallax on mobile; no auto-playing audio (already opt-in ✓); decorative elements must not shrink tap targets or contrast below AA.

---

## 33. Prioritization

P0: VQ-001 token consolidation (blocks all consistent work). P1: UX-001 lang links, VQ-003 CTA, gallery-12 UI, dashboard empty/skeleton, cinema budget, motif separations, countdown shimmer. P2: VQ-005 eyebrows, auth states, studio header unify, monogram loop, OG preview design. P3: admin density, toast rollout, VQ-006 fixture locales, guest language picker (V1.1).

---

## 34. Implementation Phases

**D-Phase 1 — Token foundation (P0):** layered CSS, DS 2.0 tokens, radius/space/type migration (mechanical), regression: tests+screenshots. **D-Phase 2 — Public site:** hero CTA, swatches, gallery-12, trust strip, lang links. **D-Phase 3 — Dashboard & studio:** calm-ops language, empty/skeleton, breadcrumbs, step header. **D-Phase 4 — Invitations:** concept contracts, motif separations, shimmer/blur-up, digit rule. **D-Phase 5 — Motion unify:** retire atlas keyframes, tokenize, storyboards. **D-Phase 6 — Mobile/RTL/a11y lock:** regression suite, digit/icon rules, contrast pass. Each phase = one PR per repo workflow.

---

## 35. Task Format

```markdown
### DESIGN-TASK-XXX — Name
Priority: / Area: / Affected Pages: / Problem: / Objective: /
Design Decision: / Implementation Details: / Components: / Tokens: /
Motion: / Responsive: / RTL: / Accessibility: / Dependencies: /
Acceptance Criteria: - [ ] … / Verification: …
```

---

## 36. Priority Matrix

Must (V1): token consolidation, lang links, gallery-12 UI, dashboard states, motif separations, motion unify. Should: eyebrows, auth states, trust strip, OG design. Can-launch-without: admin density, toast, fixture locales. Future: guest language picker, seating visuals, photo galleries.

---

## 37. Definition of Done

Single token source · layered CSS · 4-variant buttons · restored modal hierarchy · gallery-12 live · lang links work · dashboard states complete · 12 concept contracts · one motion family · mobile regression green · RTL digit/icon rules · AA contrast · CSS budget met · cross-page screenshots consistent.

---

## 38. Final Recommendations

1. Start D-Phase 1 immediately — every other design task depends on token consolidation.
2. Do not redesign aesthetics — the atelier look wins; fix architecture and gaps.
3. Ship gallery-12 + lang links early (highest conversion leverage, lowest risk).
4. Keep CSS-only motion permanently; never add animation libs without a new audit.
5. Re-shoot all 8 width screenshots after each D-Phase (use Phase 7 harness pattern).
```

---

## Evidence index

- Token conflicts: `app/globals.css:3,94-103`, `app/wisal-atelier.css:3-10,228-233`
- Radius/anarchy + keyframes: grep counts in §3 (15+ values, 20 keyframes)
- `?lang=` gap: `app/page.tsx:350` vs `InvitationClient.tsx:97`
- Gallery/swatches: `app/page.tsx:633,660,713`
- Modal eyebrows: `app/page.tsx` modal components diff (Phase 1)
- Screenshots: `design-shots/` (landing 1440/390, AR attempt, sign-in 404-by-design?, 3 previews) + Phase 7 shots
- Competitors: Aveilia, Royal Invite, BEZIAI, Snap Post, TheDigitalYes (24 Sept 2026)
- Auth-gated surfaces: NOT VERIFIED visually (no credentials) — code-reviewed only

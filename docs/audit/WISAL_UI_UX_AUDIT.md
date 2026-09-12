# Wisal UI/UX Audit

## Direction and maturity

The live homepage communicates a distinct “celestial guest atlas” rather than a generic pastel invitation site. The English-first hero is clear, the template selector gives six visually differentiated directions, and the landing narrative explains template → details → RSVP. This is a real product foundation, not a blank prototype.

The major UX issue is not visual polish alone: the application puts marketing, studio, dashboard, preview, and modal-heavy operational tools inside one very large client surface. That makes state transitions and mobile QA harder than necessary.

## Page-by-page findings

| Surface | What works | Issue / recommendation | Priority |
|---|---|---|---|
| Homepage | Clear hero, category-specific template descriptions, visible pricing, English default | Add a concise proof/trust block grounded in real claims; label illustrative testimonial as illustrative (currently done) and replace before launch. Track CTA conversion. | P2 |
| Homepage navigation | Product/templates/pricing anchors and locale control are visible | Validate sticky/mobile navigation at 320–430 px with real devices; bottom navigation competes with in-page CTAs on long pages. | P1 verification |
| Sign-in | Live page is English-default, readable, and has recovery paths | Google link failure is explained only after failure. Explain account policy near Google button/help link and make password-reset recovery prominent. | P0 |
| Workspace/dashboard | Stats, guests, RSVP activity, groups and operational paths exist | Split dashboards into route-level modules; add a single zero-state onboarding checklist and strong “next best action.” | P1 |
| Invitation studio | Template, opening style, layout, sections, preview and publishing controls exist | Progression must be route/state-safe, autosave/draft feedback must be tested, and preview must match public rendering exactly. Break out step components. | P1 |
| Guest management | CSV import, search, groups, personalised links, access segments and WhatsApp preparation exist | “Scheduled” messages do not send; wording must never imply automatic delivery. Add bulk retry/copy/share and hard limit feedback. | P1 |
| Public invitation | Separate invitation component, token-aware private access, RSVP, animation skip and reduced motion support | Test every concept on low-end Android. Ensure typography and buttons remain readable over covers; expose a visible fallback if media/animation fails. | P1 verification |
| RSVP | Segment-specific responses, party size and confirmation state are present | Add explicit “edit your response” behavior/confirmation policy; clarify whether a public invite permits a new name or only personalized guests. | P2 |
| Admin | Role-gated areas, support, templates, plans, audit and payments modeled | Admin needs pagination, empty/error/loading states and an action confirmation/audit context for high-impact changes. | P2 |
| Legal/privacy | Routes exist | Add an easily reachable contact/data request channel and publish real legal owner/contact details before launch. | P1 |

## English-first and bilingual audit

The runtime locale hook defaults to `en`, root document semantics are `lang=en dir=ltr`, and the live homepage/auth page displayed English initially. This is good.

However, persisted defaults conflict with the product requirement:

- `users.locale`, `events.defaultLocale` and base migrations default to `ar`.
- New event content/fallbacks are Arabic (`زفاف…`, Arabic bride/groom/venue/city names, default invitation template/message and backfilled segment title).
- API validation/error strings are Arabic regardless of chosen locale.

This produces an English UI that can create Arabic-first content or server messages. WIS-002 must change schema defaults, service fallbacks, migrations, and response error-code handling together, with a safe data migration for existing records.

## Design system

The product has branded tokens, quality font choices, and recognisable invitation concepts. It lacks a compact, enforceable component-level system: buttons, fields, cards, dialogs, badges, alerts, empty states and table patterns are distributed through long CSS and large React components. Create semantic tokens and shared primitives; this is an incremental refactor, not a redesign from zero.

Typography guidance: retain Manrope for English UI and IBM Plex Sans Arabic for Arabic UI; reserve Cormorant/Noto Naskh for invitation display use. Avoid using display fonts for dense dashboard data. Define minimum sizes/line heights and test Arabic numerals, mixed phone values and long venue names in RTL.

## Templates and animation

The live catalog exposes distinct visual concepts: Élan Editorial, Garden Reverie, Glass Moon, Gilded Promise, Still and Afterglow Première. The code also models envelope/card/curtain opening styles and a reduced-motion fallback. This supports the desired Cinematic Luxury direction without a need for Three.js now.

Recommendation: use CSS/GSAP only when a measured sequence cannot be achieved with CSS; do not add Three.js to public invitations until it passes a mobile performance budget. Every opening must be skippable, keyboard-safe, resilient to image failure, and have static/reduced-motion equivalents. W3C explicitly recognizes `prefers-reduced-motion` as the mechanism to respect a user’s requested reduction in interaction motion.[^1]

## Accessibility and mobile release gates

- Keyboard: verify focus enters, is trapped in, and restores from every modal; test menu, locale switch, template selector, RSVP and payment QR dialog.
- Semantics: retain real labels, fieldsets/legends, heading sequence and live regions; test Arabic `dir` after route transitions.
- Contrast: audit light text on image covers and all status/badge color combinations against WCAG AA.
- Motion: test `prefers-reduced-motion`; no auto-playing ambient audio; guest must opt in.
- Mobile: execute the full journey at 320, 360, 375, 390, 430 px plus tablet and iPhone Safari. Capture overflow, fixed bottom-nav collision, modal height/scroll lock, CSV table handling, long names/phones, and touch target sizes.

## QA matrix

| Priority | Minimum browser/device coverage |
|---|---|
| P0 | Chrome desktop + Android Chrome + iPhone Safari: auth, private invite, RSVP, publish, authorization negative cases |
| P1 | Chrome, Safari, Firefox, Edge: dashboard, guest management, admin roles, payment receipt workflow |
| P2 | iPad/Android tablet: studio preview, large tables, template gallery, RTL/LTR persistence |

[^1]: W3C, [Understanding SC 2.3.3: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), accessed September 2026.


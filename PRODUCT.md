# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Primary: engaged couples in Egypt and the wider Arabic-speaking market who need to create, personalize, and share a polished digital wedding invitation without design expertise.
- Secondary: event owners and trusted staff managing guests, invitations, attendance, support, plans, and platform content.
- Inferred from the current product and documentation; future user research may refine audience segments.

## Product Purpose

Wisal gives couples one bilingual place to create a wedding invitation, organize event moments and guest groups, share personal links, and follow invitation opens and RSVP responses. Success means a couple can move from setup to a credible, shareable invitation quickly while retaining clear control over every guest and event stage.

## Positioning

Wisal combines a culturally fluent Arabic/English invitation experience with operational guest management: each guest can receive a personal link, see only the event segments intended for them, and respond independently for each visible segment.

## Operating Context

- Couples configure their celebration on mobile or desktop, then share links primarily through WhatsApp.
- Guests open a private invitation link on mobile, review event details, and submit RSVP responses.
- Owners monitor opens, attendance, guest groups, event segments, messages, and support from a workspace.
- Platform staff use a role-gated administration area for users, templates, plans, bilingual content, and support.

## Capabilities and Constraints

- Next.js 16 and React 19 deployed on Vercel.
- Neon Serverless Postgres with Drizzle ORM and optional Neon Auth.
- Arabic and English layouts, including RTL/LTR behavior.
- Event segments, guest groups, scoped access, personalized invite tokens, per-segment RSVP, WhatsApp sharing, media uploads, support tickets, notifications, and administration.
- Payment and automated email/WhatsApp sending are intentionally not production capabilities yet.
- Production launch still requires durable rate limiting, monitoring, production accounts, legal review, and final domain configuration.
- Do not invent customer counts, conversion claims, testimonials, or delivery capabilities.

## Brand Commitments

- Product name: Wisal / وِصال.
- Existing calligraphic monogram and app icons under `public/brand/` remain recognizable brand assets.
- The experience must feel appropriate for a meaningful celebration while avoiding ornamental clutter or generic wedding-template styling.
- English is the default language; Arabic remains a first-class, directionally correct experience.

## Evidence on Hand

- Existing product flows and copy in `app/`.
- Brand assets and invitation art in `public/brand/`.
- Launch and product constraints in `docs/LAUNCH_READINESS.md`, `docs/BETA_RELEASE_GATE.md`, and `docs/auth/NEON-AUTH-ROLLOUT.md`.
- Automated tests covering bilingual behavior, invitations, guest management, administration, and launch safeguards.
- No verified customer testimonials, usage benchmarks, or commercial performance evidence is available; future work must not fabricate them.

## Product Principles

1. Make a meaningful occasion feel composed, personal, and calm.
2. Let the invitation demonstrate the product while operational controls remain clear and dependable.
3. Treat Arabic and English as equal product experiences, not translation variants.
4. Preserve guest privacy through scoped links, permissions, and restrained data exposure.
5. Prefer truthful demonstrations of real workflows over generic marketing claims.

## Accessibility & Inclusion

- Maintain keyboard focus, semantic controls, readable contrast, responsive layouts, reduced-motion support, and complete RTL/LTR behavior.
- Core flows must remain usable on mobile devices and with Arabic mobile keyboards.

# Wisal Sprint 0 — Decisions and delivery gates

## Product foundation

- Payments stay informational and disabled until launch-readiness passes.
- Arabic and English are first-class locales. The public surface ships first, followed by studio, guest invitation, user dashboard, and admin.
- The platform identity uses the Editorial Romance direction. Invitation templates keep independent visual identities.

## Event and audience model

- An event is the parent container.
- Each ceremony, reception, dinner, party, or session is an `event_segment` with its own time and venue.
- Guests belong to one operational group and may receive direct access overrides.
- Guest-visible segment data is filtered on the server. Hidden venue information must never be included in the response payload.
- RSVP is stored per guest and per segment, while the existing event-level RSVP remains compatible during migration.

## Delivery order

1. Public AR/EN experience and direction foundation.
2. Backward-compatible Neon schema on a temporary branch, verified before production approval.
3. Studio steps for event segments and guest groups.
4. Server-side invitation access filtering and per-segment RSVP.
5. User dashboard reporting, then administration.

## Gates

- Existing invitation creation and guest management tests remain green.
- No production schema change is applied without temporary-branch verification and explicit approval.
- Every visible milestone is checked on mobile and desktop, including keyboard focus and reduced motion.
- No real payment provider, credentials, checkout, or webhook is introduced in this phase.

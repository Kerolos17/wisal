# Invitation Atelier — visual direction and delivery notes

## Creative direction

Wisal invitations are treated as keepsakes, not template cards. The guest first encounters a physical-feeling artifact (paper, botanical stock, glass, gilt, monochrome stationery, or film still), then moves into a calm digital reception room for the message, schedule, RSVP, and sharing tools.

The six launch worlds keep the same guest-flow contract while changing material, crop, type posture, silhouette, and action treatment:

| Concept | Material cue | Composition | Action cue |
| --- | --- | --- | --- |
| Editorial / Love Poem | warm parchment and architectural framing | asymmetric editorial split | oxblood rule and compact RSVP |
| Botanical / Garden Night | sage paper and watercolour foliage | tall botanical arch | deep berry action |
| Glass / Moonlight | blue-black glass and pearl light | translucent layered field | copper-gold signal |
| Gilded / Golden Vows | burgundy stock and champagne gilt | framed formal plate | wine action with gilt focus |
| Minimal / White Story | uncoated white paper and ruled geometry | quiet monochrome stack | precise dark action |
| Cinematic / Cinema Night | evening film still and velvet black | bottom-weighted hero | coral light against a dark field |

## Ceremony Cabinet refinement

The public gallery is now a **live cabinet**, not a set of generic purchase cards. Selecting one of the six specimens swaps a large, real template preview in place. The customer can judge the material, crop, copy posture, and mood before choosing “Start with this design”; the choice is only then passed into the studio. This keeps browsing exploratory and does not imply that a user has already subscribed.

The envelope scene is deliberately authored as a five-layer object: ground shadow, printed envelope body, inner liner, letter stock, and a stamped seal. One action drives the sequence: the seal recedes, the flap hinges open in 3D, and the letter rises. It has a single, obvious open control and a separate skip route, instead of relying on decorative animation or an ambiguous tap target. Concept-specific liner and stock colors make the same interaction belong to each visual world without copying a reference pattern.

## Platform positioning refinement

The home page now makes the product difference explicit without claiming unfinished payment or automation features. Competitor research showed that premium digital invitations often sell the memorable envelope reveal, music, and RSVP, while many still route couples into a manual production conversation. Wisal's public page therefore positions the current product as a self-service invitation studio: preview a real invitation world, edit the essential details, publish the guest link, then follow opens and RSVPs from the dashboard.

The template gallery includes a three-part journey cue for the selected world: open, details, RSVP. This turns each preview into a small product demonstration rather than a static art card.

## Ceremony room correction

The post-hero guest journey uses a shared ceremony-room token layer. The countdown is no longer a universal dark slab on light concepts; it resolves through `--atelier-countdown-surface`, `--atelier-countdown-ink`, `--atelier-countdown-muted`, `--atelier-countdown-number`, and `--atelier-countdown-chip`. Light worlds read like mounted paper timepieces, while dark worlds use raised nocturnal surfaces with explicit high-contrast ink.

Schedule rows, RSVP sections, fields, progress, success/error states, and footer chrome now inherit the same action, field, border, and soft-shadow roles. This keeps the operational parts of the invitation connected to the hero and prevents low-contrast text over mismatched backgrounds.

## Guest flow

1. The opening scene identifies the guest and the couple, with an explicit open action and an Escape/Skip path.
2. The envelope/card/curtain reveal resolves once and moves focus to the invitation content.
3. The hero establishes the couple, date, time, venue, countdown, and RSVP entry point.
4. The message and invitation moments follow the configured section order and expose only the guest's permitted segments.
5. Schedule rows provide date, time, venue, address, and map access without hiding the primary task.
6. RSVP uses explicit labels, per-segment status, party size, optional meal preference, validation, and private-response guidance.
7. Utility actions let guests save an `.ics` date and share/copy the personal invitation URL.
8. A success/closed state closes the loop without losing the host privacy message.

## Semantic token contract

Every concept resolves the same roles in `app/globals.css`:

- `--atelier-background`: page ground
- `--atelier-surface`: invitation paper or elevated surface
- `--atelier-ink`: body and heading ink
- `--atelier-muted`: supporting copy
- `--atelier-accent`: copper/gold/coral signal
- `--atelier-border`: rules and field borders
- `--atelier-action`: primary RSVP action
- `--atelier-action-hover`: hover state
- `--atelier-focus`: keyboard focus ring
- `--atelier-success` / `--atelier-error`: feedback states

The primary action text is independent from the action fill so dark and light concepts can maintain readable contrast. Interactive controls are at least 44px high, and invitation utilities remain visible in both LTR and RTL layouts.

## Motion and performance

The opening uses one finite reveal. Hover motion is limited to action feedback. `prefers-reduced-motion: reduce` removes translation and transition effects while preserving the final state. The implementation uses existing CSS and browser APIs; no new runtime dependency or database field was added.

## Research notes

The direction was informed by current interactive invitation patterns that treat opening as part of the gift and keep the envelope, paper, music, photography, and details visually coherent:

- [Nupcii — interactive envelope template](https://nupcii.com/en/blog/madeleyne-the-wedding-invitation-that-opens-like-an-envelope)
- [Hound Design Studio — envelope wedding website](https://www.hounddesignstudio.com/product-page/wedding-website-envelope)
- [Zafaf — Arabic luxury invitation experience](https://zafaf.io/en)
- [The Digital Envelope — material-led invitation worlds](https://thedigitalenvelope.com/)
- [W3C — WCAG 2.2 contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)
- [W3C — accessible form labels and instructions](https://www.w3.org/WAI/tutorials/forms/)
- [web.dev — accessible tap targets](https://web.dev/articles/accessible-tap-targets?hl=en)
- [MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)

These references are used for analysis and interaction principles only; no visual design was copied directly.

## Verification snapshot

- `node --test tests/*.test.mjs`: 103 passing
- TypeScript no-emit check: passing
- ESLint: passing
- Next.js production build: passing
- Live visual review completed for homepage desktop/mobile and Editorial, Botanical, and Cinematic invitations. The latest source pass also covers Cinematic envelope contrast and template-anchor offset on mobile.

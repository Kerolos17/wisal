---
version: 1
slug: "app-invite-slug-invitation-client-tsx"
primary_target: "app/invite/[slug]/InvitationClient.tsx"
related_targets:
  - "app/page.tsx"
  - "app/globals.css"
  - "lib/invitation-concepts.ts"
---

# Public invitation and invitation collection surface

- Scope: the public invitation route, its opening scene, full-viewport hero, guest schedule and RSVP flow, plus the matching studio tile and phone specimen for each template.
- Mode: Celebrate and complete a task.
- Audience: invited guests opening a personal link, primarily on mobile, in Arabic or English; couples evaluating the same artifact in the studio.
- Job: recognize the celebration immediately, open the invitation confidently, understand only the event moments shared with this guest, and submit a per-segment RSVP without losing the invitation's emotional tone.
- Product truth: preserve personalized links, scoped event segments, bilingual RTL/LTR behavior, optional cover media, opening style, layout style, countdown, schedule, RSVP deadline, meal preference, party size, privacy copy, map links, music control, and Escape-to-skip behavior. Do not imply automated delivery or payment.
- Chosen direction: **Invitation Keepsake Cabinet / خزانة المقتنيات الاحتفالية**. Twelve authored invitation artifacts live inside the broader Celestial Guest Atlas product system. They share dependable guest-flow structure but do not share one universal visual shell.
- Concept contract: `love-poem` is warm editorial parchment; `garden-night` is a sage botanical arch; `moonlight` is blue-black lunar glass; `golden-vows` is burgundy gilt; `white-story` is quiet monochrome modernism; `cinema-night` is bottom-weighted film still; `rose-garden` is a blush botanical frame; `cathedral-light` is a luminous chapel arch; `desert-sunset` is a terracotta and sand split field; `velvet-night` is black-cherry theatre; `coastal-breeze` is sea-glass with a horizon-weighted image; `modern-monogram` is ink-green geometry with clipped corners.
- Semantic system: every concept provides background, paper, ink, muted ink, accent, and dark contrast roles. Shared schedule and RSVP components inherit those roles for surface, selected state, action, focus, and shadow.
- Continuity rule: the template code must resolve to the same visual concept in the studio tile, live phone preview, opening scene, public hero, and downstream guest controls.
- Responsive behavior: full-viewport concepts may be split, framed, arched, or bottom-weighted on desktop. At 700px and below, they recompose rather than merely shrink; text remains legible, image crops protect people and focal detail, and operational cards become a readable single column with at least 16px side gutters.
- Accessibility: preserve semantic buttons and fields, readable contrast, visible 2px concept-accent focus outlines with 4px offset, complete RTL/LTR mirroring, and usable mobile keyboards. Decorative openings must never remove the visible open action; Escape can bypass them.
- Memorable moment: opening the link feels like selecting one physical artifact from a cabinet—paper, glass, velvet, botanical frame, chapel, film still, or monogram—before that material world expands into the full guest journey.
- Signature interaction: the principal copy performs one 850ms clip/blur/26px-translate reveal using a settled ease, then stops. Reduced-motion users receive the final state immediately and hover translation is removed.
- Guardrail: distinctness must come from composition, material, imagery, type posture, and responsive arrangement, never from a palette swap alone.
- Unresolved: none for this shipped surface.

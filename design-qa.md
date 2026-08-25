# Design QA — Signature Invitation Collection

## Evidence

- Source visual truth: the three generated concept images in `/workspace/scratch/8ac67f09ed0b/generated_images/` (Élan Editorial, Garden Reverie, and Afterglow Première).
- Implementation screenshot: cloud-browser inline screenshot evidence, Chrome tab `http://terminal.local:4173/`, Templates gallery state.
- Viewport: desktop cloud-browser viewport, 1348 × 926 screenshot pixels, device scale factor 1.
- Source pixels: each concept 853 × 1844; implementation cards use the same 9:16 crop without density resampling.
- State: English default, LTR, public landing Templates gallery.
- Full-view comparison evidence: the three source images and browser-rendered gallery were opened in the same comparison input. All three concepts preserve their defining composition, palette, typography direction, and image treatment.
- Focused region comparison: no additional crop was needed because each complete invitation remained readable in the gallery viewport, together with its title and category.

## Findings

- No actionable P0, P1, or P2 mismatch remains.
- Typography: editorial serif, botanical calligraphic, and cinematic gold treatments remain visually distinct; platform UI labels do not compete with the artwork.
- Spacing/layout: the cards share a consistent 9:16 product frame while retaining three different internal structures.
- Colors/tokens: ivory-gold, blush-botanical, and black-amber palettes remain faithful to the source concepts.
- Image quality: production PNGs render sharply with no placeholder, stretched crop, CSS-drawn replacement, or local preview overlay.
- Copy/content: Élan Editorial, Garden Reverie, and Afterglow Première are clear, differentiated names with concise category labels.
- Accessibility/interaction: previews have descriptive alt text, cards are semantic buttons, motion is subtle, and reduced-motion rules disable nonessential animation.

## Primary interactions tested

- Public page loads with English/LTR as the default.
- All three template cards render with the expected names.
- Template cards remain clickable into the creation flow.
- The page scrolls between the hero and gallery.
- Console checked: no application-origin errors after the image-loading fix.

## Comparison history

1. Initial browser pass exposed a P1 local image-loader overlay (`Cannot read properties of undefined (reading 'fetch')`).
2. Fix: the three concept preview images now bypass the unsupported local optimisation path and serve the production files directly.
3. Post-fix evidence: all three complete concepts rendered; no application console errors remained.

## Implementation checklist

- [x] Dedicated preview art for all three concepts.
- [x] Dedicated production background assets for live invitations.
- [x] Distinct editorial, botanical, and cinematic live layouts.
- [x] Distinct card, envelope, and curtain opening themes.
- [x] Responsive and reduced-motion safeguards.
- [x] Automated build and source assertions.

## Follow-up polish

- P3: once a seeded public invitation is available locally, capture each complete opening-to-RSVP flow as a separate mobile regression baseline.

final result: passed

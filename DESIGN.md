---
name: Wisal Celestial Guest Atlas
description: A bilingual wedding invitation and guest-control system pairing a celestial product instrument with six authored celebration keepsakes for the initial collection.
colors:
  observatory-black: "#120914"
  raised-plum: "#1a0d1d"
  softened-plum: "#211126"
  cold-ivory: "#f6efe7"
  starlight-muted: "#b9aeb9"
  instrument-copper: "#d79261"
  luminous-copper: "#efad76"
  copper-rule: "rgba(215, 146, 97, .28)"
  ivory-rule: "rgba(246, 239, 231, .12)"
  invitation-paper: "#eee4da"
  invitation-ink: "#28162a"
  ceremony-surface: "color-mix(in srgb, {colors.invitation-paper} 86%, {colors.observatory-black})"
  ceremony-field: "rgba(255, 250, 244, .82)"
  ceremony-shadow: "0 24px 70px rgba(52, 28, 31, .10)"
typography:
  display:
    fontFamily: "Cormorant Garamond Variable, Cormorant Garamond, serif"
    fontSize: "clamp(48px, 4.15vw, 68px)"
    fontWeight: 520
    lineHeight: 0.92
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Cormorant Garamond Variable, Cormorant Garamond, serif"
    fontSize: "clamp(43px, 5vw, 72px)"
    fontWeight: 520
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  arabic-display:
    fontFamily: "Noto Naskh Arabic, serif"
    fontSize: "clamp(46px, 4vw, 66px)"
    fontWeight: 520
    lineHeight: 1.08
    letterSpacing: "0"
  body:
    fontFamily: "Manrope, Segoe UI, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.85
  arabic-body:
    fontFamily: "IBM Plex Sans Arabic, Segoe UI, Tahoma, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.85
  label:
    fontFamily: "Manrope, Segoe UI, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
rounded:
  invitation-control: "3px"
  instrument-control: "4px"
  framed-media: "6px"
  orbit: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "34px"
  section-min: "84px"
  section-max: "150px"
components:
  button-primary:
    backgroundColor: "{colors.instrument-copper}"
    textColor: "{colors.invitation-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.instrument-control}"
    padding: "0 21px"
    height: "50px"
  button-primary-hover:
    backgroundColor: "{colors.luminous-copper}"
    textColor: "{colors.invitation-ink}"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.cold-ivory}"
    typography: "{typography.label}"
    rounded: "0"
    padding: "0 0 2px"
    height: "44px"
  invitation-plate:
    backgroundColor: "{colors.invitation-paper}"
    textColor: "{colors.invitation-ink}"
    rounded: "{rounded.instrument-control}"
    padding: "28px 20px"
  response-rail:
    backgroundColor: "rgba(24, 11, 27, .9)"
    textColor: "{colors.cold-ivory}"
    rounded: "{rounded.instrument-control}"
    padding: "15px 18px"
    height: "74px"
---

# Design System: Wisal Celestial Guest Atlas

## Overview

**Creative North Star: "The Celestial Guest Atlas"**

Wisal presents invitation craft and guest control as one composed instrument. Plum-black observatory fields make the interface feel ceremonial without becoming ornamental; copper rules, orbit markers, and one luminous invitation plate turn operational RSVP information into part of the same visual story.

The world is editorial, nocturnal, and precise. It avoids the soft gradients, florals, pill-heavy controls, and interchangeable pastel cards of a generic wedding-template catalogue. Its drama comes from scale, sparse light, and working-instrument geometry rather than decoration.

Inside that dependable product world, the public invitation is an **Invitation Keepsake Cabinet / خزانة المقتنيات الاحتفالية**: six authored artifacts in the initial collection rather than one shell with six colorways. Every concept owns its opening treatment, image crop, type composition, material palette, frame geometry, and mobile arrangement. The RSVP, schedule, countdown, privacy, and language controls remain structurally consistent, but inherit the selected keepsake's semantic background, paper, ink, muted, accent, and dark roles.

**Key Characteristics:**

- A near-black plum field with cold ivory type and copper used as a scarce navigational signal.
- Large, low-leading serif headlines balanced by compact, highly legible interface labels.
- Ruled rails and circular orbit marks that make guest status feel measured and live.
- One pale invitation plate held inside the darker system as the principal luminous object.
- Complete LTR and RTL composition, with Arabic display typography treated as a native mode.
- Six visually distinct invitation artifacts connected by one reliable bilingual guest journey; the concept contract can expand later without changing guest-flow behavior.
- A shared seven-role invitation palette contract that lets operational controls belong to each keepsake without changing their behavior.

## Colors

The palette behaves like a dark observatory: three close plum surfaces establish depth, cold ivory carries language, and two copper intensities distinguish structure from action.

### Primary

- **Instrument Copper:** The working accent for primary actions, borders, progress marks, and selected states.
- **Luminous Copper:** The brighter signal reserved for emphasized words, hover states, icons, and focus outlines.

### Secondary

- **Invitation Paper:** The single warm-light surface used by the invitation specimen.
- **Invitation Ink:** The dense plum ink used only on light invitation and copper-button surfaces.

### Neutral

- **Observatory Black:** The continuous page ground and scrollbar track.
- **Raised Plum:** The first tonal lift for the journey field, orbit nodes, and reduced-transparency overlays.
- **Softened Plum:** The second tonal lift behind media and selected content regions.
- **Cold Ivory:** Primary text and high-contrast marks.
- **Starlight Muted:** Supporting copy, metadata, and quiet status text.
- **Copper Rule / Ivory Rule:** Fine structural and low-emphasis dividers; they define geometry without brightening the field.

**The Copper Is an Instrument Rule.** Copper indicates action, measurement, or a live state; it is never sprayed across large decorative surfaces.

**The One Light Plate Rule.** Pale invitation paper belongs to the invitation artifact. The surrounding product interface remains dark so the crafted object keeps its authority.

### Invitation Collection

Each keepsake defines seven local semantic roles—background, paper, ink, muted ink, accent, dark contrast, and action text—rather than borrowing the atlas palette indiscriminately. The action-text role is chosen independently for each accent and must maintain at least 4.5:1 contrast. Love Poem is warm editorial parchment; Garden Night is sage botanical paper; Moonlight is blue-black glass; Golden Vows is burgundy and gilt; White Story is strict monochrome; Cinema Night is nocturnal film; Rose Garden is blush botanical; Cathedral Light is stone, blue-grey, and antique gold; Desert Sunset is terracotta and sand; Velvet Night is black cherry and brass; Coastal Breeze is sea-glass and rust; Modern Monogram is ink-green and muted gold.

**The Artifact Before Theme Rule.** A concept must change composition, material, and image treatment—not merely swap accent colors.

### Ceremony Room Semantics

The post-hero invitation journey is governed by a stable semantic contract so every section reads as one authored artifact:

- **paper/background:** the body field that sits behind message, countdown, schedule, RSVP, and footer.
- **ink/heading:** the highest-contrast text color for names, section titles, labels, and form copy.
- **muted text:** secondary explanatory copy and metadata; never used for required form labels.
- **accent:** small ceremonial signals, numerals, rules, and secondary links.
- **border:** one-pixel paper or copper rules that frame without creating heavy cards.
- **surface:** mounted sections such as message, schedule rows, RSVP panels, and footer plate.
- **action/action hover:** the RSVP button and selected response states, paired with a separate action-ink role.
- **focus ring:** visible keyboard focus derived from the active accent.
- **success/error:** status copy and submission feedback only; they should never become the dominant palette.

The countdown uses its own readable subset—countdown-surface, countdown-ink, countdown-muted, countdown-number, and countdown-chip—so light concepts do not inherit a black slab and dark concepts do not place dark type on dark surfaces. Inputs use a field token separate from cards to keep RSVP affordances obvious on every concept.

## Typography

**Display Font:** Cormorant Garamond Variable (with Cormorant Garamond and serif fallbacks)  
**Arabic Display Font:** Noto Naskh Arabic (with serif fallback)  
**English Body and Label Font:** Manrope (with Segoe UI, Arial, and sans-serif fallbacks)  
**Arabic Body and Label Font:** IBM Plex Sans Arabic (with Segoe UI, Tahoma, Arial, and sans-serif fallbacks)

**Character:** Display typography is romantic through proportion rather than ornament: high contrast, tight tracking, and compressed leading give headlines an engraved, celestial quality. The direction-aware sans-serif layer uses Manrope for English and IBM Plex Sans Arabic for Arabic, keeping controls, pricing, and RSVP data operational in either reading direction.

### Hierarchy

- **Display:** Used for the first-viewport thesis. It is large, tightly tracked, low-leading, and may carry one copper phrase.
- **Headline:** Used for section propositions and final calls to action; it remains editorial but gives longer lines slightly more air.
- **Arabic Display:** Uses Noto Naskh Arabic with open leading and no negative tracking; never force Latin display metrics onto Arabic.
- **Title:** Cormorant Garamond at roughly 27–42px for template names, orbit steps, plans, quotes, and invitation names.
- **Body:** Compact Manrope copy in English and IBM Plex Sans Arabic in Arabic, generally 12–15px with generous 1.75–1.85 leading and a practical measure near 580px.
- **Label:** The same direction-aware UI pairing at a dense 8–12px, usually bold; uppercase is confined to the invitation specimen's English microcopy.

**The Two Voices Rule.** Serif type carries ceremony and propositions; sans-serif type carries instructions, controls, evidence, prices, and state.

Within the keepsake collection, the same two type families may change posture: centered and engraved, left- or right-aligned and editorial, cinematic at the lower edge, or deliberately sans-serif and minimal. Arabic keeps native shaping and leading in every composition; visual distinctness never comes from forcing Latin tracking onto Arabic.

## Layout

The desktop hero is an asymmetrical two-column field: a compact copy column occupies roughly the left third while the astrolabe stage owns the larger right field. The invitation sits near the center of that instrument and the RSVP rail crosses its lower edge. A vertical copper rule quietly establishes the copy axis.

Sections use fluid side padding and an 84–150px vertical range. Ruled proof and pricing bands run edge to edge; editorial sections use broad asymmetric grids rather than repeated equal cards. Template selection uses one dominant specimen beside two smaller ones, while the journey and product sections pair a proposition column with a denser operational column.

At 1100px, the stage and complex grids compress. At 900px, navigation simplifies, hero columns stack, proof becomes three columns below its proposition, and the story becomes a single column. At 600px, the primary action becomes full width, sections reduce to 18px side gutters, proof and template grids become single-column, pricing loses its desktop featured inset, and the RSVP rail spans the instrument stage.

**The Instrument Owns the Air Rule.** Do not center the hero into two equal cards. Preserve the imbalance between concise copy and the large working visual.

Invitation openings and heroes fill the available viewport and compose around the artifact's image rather than a universal centered card. Desktop concepts may use split editorial fields, chapel arches, framed central plates, or bottom-weighted cinematic copy. At 700px and below, those arrangements intentionally recompose: split fields become vertical image-to-paper stories, cinematic crops protect faces and text, and operational content settles into a readable single column with 16px minimum side gutters.

## Elevation & Depth

The system is flat by default and uses tonal layering, thin rules, and overlap for most depth. Shadows are reserved for physically legible objects: the astrolabe, invitation plate, primary action, RSVP rail, and story proof. Glass blur belongs only to live-status overlays and the sticky header; reduced-transparency mode replaces it with raised plum.

### Shadow Vocabulary

- **Action Lift:** A compact dark shadow beneath the copper primary action, paired with a 2px upward hover shift.
- **Instrument Falloff:** A broad drop shadow that separates the copper artifact from the plum void without creating a card.
- **Invitation Object:** A deep ambient shadow plus inset paper and ink rings, making the plate feel printed and physically mounted.
- **Response Overlay:** A medium ambient shadow paired with translucent raised plum and 14px blur.

**The Physical Object Rule.** If a surface is not an object or an overlay, separate it with tone and rules rather than a shadow.

Keepsakes use depth according to their material: translucent blur for Moonlight, mounted paper shadow for editorial artifacts, image falloff for cinematic concepts, and tonal separation for White Story. Shared RSVP and schedule cards use one restrained ambient shadow tinted from the active concept's dark role.

## Shapes

The form language is precise and instrument-like. Primary controls, invitation controls, overlays, and framed media use restrained 3–6px corners. True circles are reserved for orbit nodes, the final celestial rings, icons, and the scrollbar thumb. Long pill buttons do not belong to this marketing world; the rounded mobile quick-navigation dock is the deliberate app-shell exception, visually separating persistent product navigation from the atlas content.

Borders are one-pixel copper or ivory rules. Media is clipped into quiet rectangular frames; large circular geometry sits behind content and never rounds the content container itself.

**The Square Control Rule.** Calls to action and functional overlays use compact corners, not soft capsules.

The invitation collection permits authored silhouettes where they carry meaning: garden and rose concepts use tall botanical arches, Cathedral Light uses a chapel arch, Modern Monogram uses clipped corners, and White Story uses ruled rectangles. These silhouettes belong to the keepsake art; interactive controls retain restrained 3–4px corners and clear focus outlines.

## Components

### Buttons

- **Shape:** Compact instrument corners with a 50px primary height and deliberately modest horizontal padding.
- **Primary:** Copper fill, invitation ink, bold compact sans-serif label, and a directional arrow separated by inline space.
- **Hover / Focus:** Hover brightens to luminous copper and lifts 2px; active presses down and scales subtly. Keyboard focus uses a 2px luminous-copper outline with 4px offset.
- **Link:** Transparent, ivory, and bottom-ruled. It reads as a secondary path, never as a second filled button.

### Cards / Containers

- **Template Frames:** 6px corners, low-contrast ivory rule, raised-plum fallback, and a dark lower image gradient for labels. Hover strengthens the rule, lifts 5px, and gently scales the image.
- **Invitation Plate:** Warm pale paper, copper border, restrained corners, deep ambient shadow, and inset print-like rings.
- **Proof Bands:** Flat, edge-to-edge rails separated by low-contrast ivory rules; data is grouped through typography rather than enclosed mini-cards.

### Navigation

The sticky desktop header is translucent observatory black with an 18px blur and a single bottom rule. Navigation labels are small ivory sans-serif text; hover and focus draw a fine copper underline. At tablet width, the central navigation and creation shortcut are removed so account and locale controls remain clear. On mobile, a fixed four-destination quick-navigation dock sits 12px from each side and 10px from the bottom; its pale translucent shell and plum active tile intentionally read as persistent product chrome rather than atlas content.

### RSVP Rail

The signature response rail is a translucent raised-plum strip crossing the invitation's orbit. It combines microcopy, a compact count, a one-pixel progress line with three circular markers, and a luminous confirmed state. Its role is to prove that guest operations belong inside the invitation experience, not beside it.

### Orbit Journey

Journey steps sit on one ruled vertical path. Copper-outlined circular icons interrupt the line, while serif titles and muted explanatory copy create a measured sequence without conventional numbered cards.

### Invitation Keepsake Collection

Each of the six initial template codes resolves to one stable concept across the studio tile, phone preview, opening scene, and public hero. The compact studio specimen carries an edition label, monogram or intentional absence, invitation line, couple composition, date, place, and action rendered through the concept's local palette and silhouette. The public experience expands the same visual grammar to the full viewport rather than substituting a generic theme.

### Guest Flow Controls

Schedule rows, countdown, segment responses, party size, meal preference, privacy copy, and the primary RSVP action share one dependable structure. Their paper, ink, accent, selection, and focus colors resolve from the active keepsake. The selected response uses the concept's dark role; the primary action uses its accent role and always exposes a 2px focus outline with 4px offset.

### Operational Surfaces

Studio, event dashboard, and administration share one semantic token layer: canvas, surface, raised surface, ink, muted text, accent, soft accent, border, navigation, and elevation. These roles keep forms, panels, sidebars, and states visually consistent without borrowing colors from an individual invitation concept. Operational labels and metadata never render below 12px, touch controls reach at least 44px on mobile, and every interactive control exposes a visible three-pixel focus ring.

### Keepsake Reveal

The signature entrance is a single 850ms clip, blur, and 26px vertical translation that resolves completely and then stops. It reveals the main invitation copy once; it does not loop or compete with RSVP interaction. Reduced-motion preference removes both this reveal and hover translation while preserving the final composition.

## Do's and Don'ts

### Do:

- **Do** preserve the plum-black field, cold ivory hierarchy, and sparse copper signal across new marketing sections.
- **Do** use rules, axes, orbit marks, and asymmetric grids to organize dense information.
- **Do** let one crafted invitation or artifact dominate a composition while operational proof crosses or frames it.
- **Do** mirror composition and directional arrows for RTL, and switch Arabic display copy to Noto Naskh Arabic with its own leading.
- **Do** honor reduced-motion and reduced-transparency preferences without weakening hierarchy.
- **Do** preserve the selected template code from studio specimen through opening scene, public hero, and guest controls.
- **Do** give each invitation a distinct responsive composition while keeping RSVP behavior and information order dependable.

### Don't:

- **Don't** turn Wisal into a pastel wedding-template catalogue, floral mood board, or grid of interchangeable rounded cards.
- **Don't** use copper as a large background wash; its rarity is what makes action and measurement legible.
- **Don't** introduce pill-shaped primary controls or excessive corner rounding into the atlas world.
- **Don't** add unverified testimonials, customer counts, conversion claims, or payment capability as visual proof.
- **Don't** animate continuously. Entry motion should reveal hierarchy, settle, and disappear.
- **Don't** collapse the six initial keepsakes into one universal card with palette swaps.
- **Don't** let a decorative opening obscure the invitation title, open action, or Escape-to-skip path.

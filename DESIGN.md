---
name: Wisal Celestial Guest Atlas
description: A bilingual wedding invitation and guest-control system mapped as a copper celestial instrument.
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

**Key Characteristics:**

- A near-black plum field with cold ivory type and copper used as a scarce navigational signal.
- Large, low-leading serif headlines balanced by compact, highly legible interface labels.
- Ruled rails and circular orbit marks that make guest status feel measured and live.
- One pale invitation plate held inside the darker system as the principal luminous object.
- Complete LTR and RTL composition, with Arabic display typography treated as a native mode.

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

## Layout

The desktop hero is an asymmetrical two-column field: a compact copy column occupies roughly the left third while the astrolabe stage owns the larger right field. The invitation sits near the center of that instrument and the RSVP rail crosses its lower edge. A vertical copper rule quietly establishes the copy axis.

Sections use fluid side padding and an 84–150px vertical range. Ruled proof and pricing bands run edge to edge; editorial sections use broad asymmetric grids rather than repeated equal cards. Template selection uses one dominant specimen beside two smaller ones, while the journey and product sections pair a proposition column with a denser operational column.

At 1100px, the stage and complex grids compress. At 900px, navigation simplifies, hero columns stack, proof becomes three columns below its proposition, and the story becomes a single column. At 600px, the primary action becomes full width, sections reduce to 18px side gutters, proof and template grids become single-column, pricing loses its desktop featured inset, and the RSVP rail spans the instrument stage.

**The Instrument Owns the Air Rule.** Do not center the hero into two equal cards. Preserve the imbalance between concise copy and the large working visual.

## Elevation & Depth

The system is flat by default and uses tonal layering, thin rules, and overlap for most depth. Shadows are reserved for physically legible objects: the astrolabe, invitation plate, primary action, RSVP rail, and story proof. Glass blur belongs only to live-status overlays and the sticky header; reduced-transparency mode replaces it with raised plum.

### Shadow Vocabulary

- **Action Lift:** A compact dark shadow beneath the copper primary action, paired with a 2px upward hover shift.
- **Instrument Falloff:** A broad drop shadow that separates the copper artifact from the plum void without creating a card.
- **Invitation Object:** A deep ambient shadow plus inset paper and ink rings, making the plate feel printed and physically mounted.
- **Response Overlay:** A medium ambient shadow paired with translucent raised plum and 14px blur.

**The Physical Object Rule.** If a surface is not an object or an overlay, separate it with tone and rules rather than a shadow.

## Shapes

The form language is precise and instrument-like. Primary controls, invitation controls, overlays, and framed media use restrained 3–6px corners. True circles are reserved for orbit nodes, the final celestial rings, icons, and the scrollbar thumb. Long pill buttons do not belong to this marketing world; the rounded mobile quick-navigation dock is the deliberate app-shell exception, visually separating persistent product navigation from the atlas content.

Borders are one-pixel copper or ivory rules. Media is clipped into quiet rectangular frames; large circular geometry sits behind content and never rounds the content container itself.

**The Square Control Rule.** Calls to action and functional overlays use compact corners, not soft capsules.

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

## Do's and Don'ts

### Do:

- **Do** preserve the plum-black field, cold ivory hierarchy, and sparse copper signal across new marketing sections.
- **Do** use rules, axes, orbit marks, and asymmetric grids to organize dense information.
- **Do** let one crafted invitation or artifact dominate a composition while operational proof crosses or frames it.
- **Do** mirror composition and directional arrows for RTL, and switch Arabic display copy to Noto Naskh Arabic with its own leading.
- **Do** honor reduced-motion and reduced-transparency preferences without weakening hierarchy.

### Don't:

- **Don't** turn Wisal into a pastel wedding-template catalogue, floral mood board, or grid of interchangeable rounded cards.
- **Don't** use copper as a large background wash; its rarity is what makes action and measurement legible.
- **Don't** introduce pill-shaped primary controls or excessive corner rounding into the atlas world.
- **Don't** add unverified testimonials, customer counts, conversion claims, or payment capability as visual proof.
- **Don't** animate continuously. Entry motion should reveal hierarchy, settle, and disappear.

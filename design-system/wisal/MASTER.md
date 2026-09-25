# Design System Master File — Wisal

> **⚠️ SUPERSEDED — DO NOT BUILD FROM THIS FILE.**
> This folder held a generated scaffold (2026-08-25) whose palette, fonts, and
> `--color-*` variables never shipped. The authoritative sources are:
>
> 1. **`DESIGN.md`** (repo root) — the approved Atelier Wisal direction:
>    lilac/porcelain/aubergine + chartreuse action, per-world invitation
>    palettes, the Tailored Corner Rule, component specs, and Do/Don't rules.
> 2. **`app/design/wisal.css`** — the single stylesheet, carrying the live
>    `--ds-*` token source (`tokens` section) and the full cascade in order:
>    tailwind → tokens → legacy base → atlas (pruned target) → atelier.
> 3. **`app/components/ui/`** — the sanctioned primitives (Button with
>    `tone="action"|"ink"`, Card, Input, Modal, Badge), exported via the
>    barrel `index.ts`.
>
> When in doubt, DESIGN.md + wisal.css win over anything in this folder.
> This redirect exists so stale generated guidance is never mistaken for the
> shipped system.

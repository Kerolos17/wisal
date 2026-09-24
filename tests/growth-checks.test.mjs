import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const preview = await readFile(new URL("../app/invite/preview/[concept]/page.tsx", import.meta.url), "utf8");

test("TASK-009 gallery now showcases all 12 concepts", () => {
  for (const code of ["rose-garden","cathedral-light","desert-sunset","velvet-night","coastal-breeze","modern-monogram"]) {
    assert.match(page, new RegExp(code));
  }
  assert.match(page, /showcaseTemplates = \[.*rose-garden/);
  assert.doesNotMatch(page, /EGP.*-day subscription/);
  assert.match(page, /event access for/);
  assert.match(page, /وصول للمناسبة لمدة/);
});

test("TASK-009 sharing strip mentions personal WhatsApp links", () => {
  assert.match(page, /personal WhatsApp link|رابط خاص به عبر واتساب/);
});

test("review fix: every showcased concept has an atelier direction entry", () => {
  const block = page.match(/const atelierDirections = \{[\s\S]*?\n\} as const/);
  assert.ok(block, "atelierDirections block exists");
  for (const code of ["love-poem","garden-night","moonlight","golden-vows","white-story","cinema-night","rose-garden","cathedral-light","desert-sunset","velvet-night","coastal-breeze","modern-monogram"]) {
    assert.match(block[0], new RegExp(`(?:"${code}"|${code}:)`), `missing direction for ${code}`);
  }
});

test("preview route still covers 12 and stays noindex", () => {
  assert.match(preview, /previewConceptCodes = \[/);
  for (const code of ["rose-garden","modern-monogram"]) assert.match(preview, new RegExp(code));
  assert.match(preview, /robots.*index:\s*false/);
});

test("D-Phase 2: landing honors ?lang= links and hero swatches are larger", () => {
  assert.match(page, /useWisalLocale\("lang"\)/);
  assert.match(page, /showcaseTemplates\.slice\(0, 6\)/);
  assert.match(page, /title=\{ar \? template\.name : template\.enName\}/);
});

test("D-Phase 2: swatches use radius token and larger sizes", async () => {
  const atelier = await readFile(new URL("../app/wisal-atelier.css", import.meta.url), "utf8");
  const rule = atelier.match(/\.atelier-swatches button \{[^}]*\}/);
  assert.ok(rule);
  assert.match(rule[0], /width: 96px/);
  assert.match(rule[0], /var\(--ds-radius-md\)/);
  assert.match(atelier, /\.atelier-swatches button \{ width: 76px; \}/);
});

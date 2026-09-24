import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const admin = await readFile(new URL("../app/admin-dashboard.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("D-Phase 4: public catalogue merges all templates (no six-gate)", () => {
  assert.doesNotMatch(page, /rows\.filter\(\(row\) => atelierTemplates\.some/);
  assert.match(page, /rows\.map\(\(row, index\) =>/);
  assert.match(page, /templates\.find\(\(item\) => item\.code === row\.code\)/);
});

test("D-Phase 4: admin manages all templates with twelve-edition copy", () => {
  assert.doesNotMatch(admin, /data\.templates\.slice\(0, 6\)/);
  assert.match(admin, /Twelve Editorial Atelier editions/);
  assert.match(admin, /adminArtTones\[index % adminArtTones\.length\]/);
});

test("D-Phase 4: rose/cathedral openings diverge from garden/golden pairs", () => {
  const rose = css.match(/\.opening-concept-rose-garden \.opening-envelope\{[^}]*\}/);
  const garden = css.match(/\.opening-concept-garden-night \.opening-envelope\{[^}]*\}/);
  assert.ok(rose && garden && rose[0] !== garden[0], "rose vs garden opening must differ");
  assert.match(rose[0], /160,78,101/);
  const cath = css.match(/\.opening-concept-cathedral-light \.opening-envelope\{[^}]*\}/);
  const golden = css.match(/\.opening-concept-golden-vows \.opening-envelope\{[^}]*\}/);
  assert.ok(cath && golden && cath[0] !== golden[0], "cathedral vs golden opening must differ");
  assert.match(cath[0], /100px 100px 0 0/);
});

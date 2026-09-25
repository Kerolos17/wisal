import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const tokens = await readFile(new URL("../app/design/wisal.css", import.meta.url), "utf8");
const atlas = await readFile(new URL("../app/design/wisal.css", import.meta.url), "utf8");
const atelier = await readFile(new URL("../app/design/wisal.css", import.meta.url), "utf8");

test("D-Phase 5: easing tokens exist (cinematic + curtain)", () => {
  assert.match(tokens, /--ds-ease-cinematic:\s*cubic-bezier\(\.16,\s*1,\s*\.3,\s*1\)/);
  assert.match(tokens, /--ds-ease-curtain:\s*cubic-bezier\(\.76,\s*0,\s*\.24,\s*1\)/);
});

test("D-Phase 5: no raw cinematic/curtain beziers in animation declarations", () => {
  const atlasSection = atlas.slice(atlas.indexOf("ATLAS (legacy theme"), atlas.indexOf("ATELIER (approved direction)"));
  const atelierSection = atelier.slice(atelier.indexOf("ATELIER (approved direction)"));
  for (const [name, src] of [["atlas", atlasSection], ["atelier", atelierSection]]) {
    assert.doesNotMatch(src, /cubic-bezier\(\.16, ?1, ?\.3, ?1\)/, `${name} still has raw cinematic bezier`);
    assert.doesNotMatch(src, /cubic-bezier\(\.76, ?0, ?\.24, ?1\)/, `${name} still has raw curtain bezier`);
  }
  assert.match(atlas, /var\(--ds-ease-cinematic\)/);
  assert.match(atelier, /var\(--ds-ease-cinematic\)/);
  assert.match(atelier, /var\(--ds-ease-curtain\)/);
});

test("D-Phase 5: both motion families retained with distinct roles (no silent retire)", () => {
  assert.match(atlas, /@keyframes atlas-copy-in/);
  assert.match(atelier, /@keyframes atelier-invite-open/);
});

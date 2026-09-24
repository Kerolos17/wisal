import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const atelier = await readFile(new URL("../app/wisal-atelier.css", import.meta.url), "utf8");

function luminance(hex) {
  const c = hex.replace("#", "");
  const rgb = [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test("gallery stage copy is always the light panel (no dark-on-dark)", () => {
  const block = atelier.match(/\/\* Gallery stage is always the light atelier panel[\s\S]*?\.atlas-template-stage-cinema-night \.atlas-template-stage-copy\s*\{[^}]*\}/);
  assert.ok(block, "light-panel override block exists");
  for (const code of ["love-poem", "garden-night", "moonlight", "golden-vows", "cinema-night"]) {
    assert.match(block[0], new RegExp(`\\.atlas-template-stage-${code} \\.atlas-template-stage-copy`), `${code} covered`);
  }
  assert.match(block[0], /background:\s*#fff/);
});

test("gallery journey strip uses light cells with readable text", () => {
  assert.match(atelier, /\.atlas-template-stage-copy \.atlas-template-path span \{[^}]*background:\s*#f6f0fa/);
});

test("gallery stage text meets AA on the light panel", () => {
  // aubergine #432846 on white
  assert.ok(ratio("#432846", "#ffffff") >= 7, "h3/body AA");
  // dt #72577a on white
  assert.ok(ratio("#72577a", "#ffffff") >= 4.5, "dt AA");
});

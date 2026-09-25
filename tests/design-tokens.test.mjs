import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const tokens = await readFile(new URL("../app/design/tokens.css", import.meta.url), "utf8");
const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
const atelier = await readFile(new URL("../app/wisal-atelier.css", import.meta.url), "utf8");

test("D-Phase 1 token source defines DS 2.0 color/type/space/radius/motion/elevation", () => {
  for (const t of ["--ds-bg", "--ds-surface", "--ds-ink", "--ds-ink-muted", "--ds-line", "--ds-brand", "--ds-action", "--ds-gold", "--ds-success", "--ds-warning", "--ds-error", "--ds-info"]) {
    assert.match(tokens, new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const t of ["--ds-font-ui", "--ds-font-display", "--ds-text-h1", "--ds-text-body"]) {
    assert.match(tokens, new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const t of ["--ds-space-4", "--ds-space-8", "--ds-radius-sm", "--ds-radius-md", "--ds-radius-lg", "--ds-radius-full", "--ds-motion-fast", "--ds-motion-base", "--ds-ease-out", "--ds-shadow-soft"]) {
    assert.match(tokens, new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("tokens load before legacy stylesheets", () => {
  const tokensIdx = layout.indexOf("./design/tokens.css");
  const globalsIdx = layout.indexOf("./globals.css");
  assert.ok(tokensIdx !== -1 && globalsIdx !== -1 && tokensIdx < globalsIdx);
});

test("atelier primary buttons consume radius/motion tokens (no hardcoded 13px)", () => {
  const primary = atelier.match(/\.atlas-primary \{[^}]*\}/);
  assert.ok(primary);
  assert.match(primary[0], /var\(--ds-radius-md\)/);
  assert.match(primary[0], /var\(--ds-motion-base\)/);
  assert.doesNotMatch(primary[0], /border-radius:\s*13px/);
});

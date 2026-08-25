import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("self-hosted bilingual typography is explicit and direction-aware", () => {
  assert.match(layout, /@fontsource\/ibm-plex-sans-arabic/);
  assert.match(layout, /@fontsource\/noto-naskh-arabic/);
  assert.match(layout, /@fontsource-variable\/manrope/);
  assert.match(layout, /@fontsource-variable\/cormorant-garamond/);
  assert.match(styles, /--font-ar-ui:/);
  assert.match(styles, /--font-en-display:/);
  assert.match(styles, /\[dir="rtl"\]\{--font-ui:/);
  assert.match(styles, /\[dir="ltr"\]\{--font-ui:/);
});

test("the preferred cinematic direction is limited to the public home view", () => {
  assert.match(page, /className=\{`view-\$\{view\}`\}/);
  assert.match(styles, /\.view-home \.hero\{/);
  assert.match(styles, /linear-gradient\(135deg,#1d0d21/);
  assert.match(styles, /\.view-home \.invite-card\{/);
  assert.match(styles, /\.view-home \.site-header\{/);
});

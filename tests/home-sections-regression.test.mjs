import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const home = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("homepage journey uses separated step headers and responsive cards", () => {
  assert.match(home, /journey-step-head/);
  assert.match(home, /LayoutTemplate aria-hidden/);
  assert.match(home, /ListChecks aria-hidden/);
  assert.match(home, /Send aria-hidden/);
  assert.match(styles, /\.view-home \.journey-grid article\{[^}]*min-height:300px/);
  assert.match(styles, /@media\(max-width:980px\)[^{]*\{\.view-home \.journey-grid\{grid-template-columns:1fr\}/);
});

test("testimonial image loads directly and quote keeps a readable measure", () => {
  assert.match(home, /cinematic-palace-hero\.webp/);
  assert.match(home, /unoptimized/);
  assert.match(home, /testimonial-proof/);
  assert.match(styles, /\.view-home \.testimonial-media>img\{[^}]*object-fit:cover/);
  assert.match(styles, /\.view-home \.testimonial-copy blockquote\{[^}]*max-width:570px/);
  assert.match(styles, /word-break:normal;overflow-wrap:normal/);
});

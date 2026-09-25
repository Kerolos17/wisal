import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const home = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../app/design/wisal.css", import.meta.url), "utf8");

test("homepage journey uses a responsive celestial orbit timeline", () => {
  assert.match(home, /atlas-orbit-steps/);
  assert.match(home, /LayoutTemplate aria-hidden/);
  assert.match(home, /ListChecks aria-hidden/);
  assert.match(home, /Send aria-hidden/);
  assert.match(styles, /\.atlas-orbit-steps article \{[^}]*min-height: 180px/);
  assert.match(styles, /@media\(max-width:1024px\)[\s\S]*\.atlas-journey,[\s\S]*grid-template-columns: 1fr/);
});

test("story section shows a product-truth preview (no testimonial format) with readable measure", () => {
  assert.match(home, /cinematic-palace-hero\.webp/);
  assert.match(home, /unoptimized/);
  assert.match(home, /atlas-story-proof/);
  assert.match(styles, /\.atlas-story-media > img \{[^}]*object-fit: cover/);
  assert.match(styles, /\.atlas-story-copy blockquote \{[^}]*max-width: 580px/);
  assert.match(home, /Replies arrive from each guest's private link/);
  assert.doesNotMatch(home, /illustrative example|Layla and Kareem,/);
});

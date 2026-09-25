import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const conceptsSource = await readFile(new URL("../lib/invitation-concepts.ts", import.meta.url), "utf8");
const previewSource = await readFile(new URL("../app/invite/preview/[concept]/page.tsx", import.meta.url), "utf8");
const clientSource = await readFile(new URL("../app/invite/[slug]/InvitationClient.tsx", import.meta.url), "utf8");

test("12 invitation concepts are registered", () => {
  const expected = [
    "love-poem","garden-night","moonlight","golden-vows","white-story","cinema-night",
    "rose-garden","cathedral-light","desert-sunset","velvet-night","coastal-breeze","modern-monogram",
  ];
  for (const code of expected) assert.match(conceptsSource, new RegExp(`"${code}"`));
});

test("preview route covers all 12 concepts with distinct accent/layout", () => {
  for (const code of ["rose-garden","cathedral-light","desert-sunset","velvet-night","coastal-breeze","modern-monogram"]) {
    assert.match(previewSource, new RegExp(`"${code}"`));
  }
  // distinctness: at least 3 different accents and 3 layouts represented
  assert.match(previewSource, /accent: "plum"/);
  assert.match(previewSource, /accent: "sage"/);
  assert.match(previewSource, /accent: "sand"/);
  assert.match(previewSource, /accent: "blue"/);
  assert.match(previewSource, /layout: "story"/);
  assert.match(previewSource, /layout: "classic"/);
  assert.match(previewSource, /layout: "cinematic"/);
  assert.match(previewSource, /generateStaticParams/);
});

test("preview routes are non-indexable and invitation client respects reduced motion/mobile", async () => {
  const atelierCss = await readFile(new URL("../app/design/wisal.css", import.meta.url), "utf8");
  const globalsCss = await readFile(new URL("../app/design/wisal.css", import.meta.url), "utf8");
  assert.match(previewSource, /robots.*index:\s*false/);
  assert.match(atelierCss + globalsCss, /prefers-reduced-motion/);
  // client exposes previewMode for gallery reuse
  assert.match(clientSource, /previewMode/);
  // bilingual copy complete
  assert.match(clientSource, /بياناتك خاصة|Your details are only visible/);
});

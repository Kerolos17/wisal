import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const localeSource = await readFile(new URL("../app/use-wisal-locale.ts", import.meta.url), "utf8");
const stylesSource = await readFile(new URL("../app/design/wisal.css", import.meta.url), "utf8");

test("language preference is persistent and updates document semantics", async () => {
  const providerSource = await readFile(new URL("../app/locale-provider.tsx", import.meta.url), "utf8");
  assert.match(localeSource, /type Locale = "ar" \| "en"/);
  assert.match(providerSource, /localStorage\.setItem\(STORAGE_KEY, locale\)/);
  assert.match(providerSource, /document\.cookie = `wisal-locale=/);
  assert.match(providerSource, /document\.documentElement\.lang = next/);
  assert.match(providerSource, /document\.documentElement\.dir = next === "ar" \? "rtl" : "ltr"/);
});

test("the public experience exposes an accessible language switcher", () => {
  assert.match(pageSource, /className="locale-switch"/);
  assert.match(pageSource, /Switch to English/);
  assert.match(pageSource, /التبديل إلى العربية/);
  assert.match(pageSource, /Choose your plan and pay securely via transfer receipt, then your plan activates after review/);
});

test("LTR uses explicit direction-aware layout overrides", () => {
  assert.match(stylesSource, /\[dir="ltr"\] \.template-card/);
  assert.match(stylesSource, /\[dir="ltr"\] \.legend span b/);
  assert.match(stylesSource, /\.locale-switch:focus-visible/);
  assert.match(stylesSource, /\[dir="ltr"\] \.studio-panel/);
  assert.match(stylesSource, /\[dir="ltr"\] \.dashboard-page aside nav button/);
});

test("studio and dashboard receive the active locale and expose English UI", () => {
  assert.match(pageSource, /<Dashboard locale=\{locale\}/);
  assert.match(pageSource, /<BuilderLoading locale=\{locale\}/);
  assert.match(pageSource, /Invitation studio/);
  assert.match(pageSource, /Guest management/);
  assert.match(pageSource, /Attendance by stage/);
  assert.match(pageSource, /Prepare a targeted message/);
  assert.match(pageSource, /Start a new invitation/);
  assert.match(pageSource, /Add a new guest/);
  assert.match(pageSource, /Create a new group/);
  assert.match(pageSource, /Add your guest list in minutes/);
  assert.match(pageSource, /Add a new stage/);
  assert.match(pageSource, /We could not load your invitations/);
});

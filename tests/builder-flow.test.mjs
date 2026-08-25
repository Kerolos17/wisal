import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const ownerSource = await readFile(new URL("../lib/current-owner.ts", import.meta.url), "utf8");
const dataSource = await readFile(new URL("../lib/wisal-data.ts", import.meta.url), "utf8");
const stylesSource = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("does not mount the builder until an active event is ready", () => {
  assert.match(pageSource, /dataState === "ready" && eventData && \(/);
  assert.match(pageSource, /dataState === "loading" && <BuilderLoading/);
  assert.match(pageSource, /dataState === "error" && <BuilderUnavailable/);
  assert.match(pageSource, /dataState === "empty" && <BuilderUnavailable/);
});

test("opens event creation instead of a blank builder when no event exists", () => {
  assert.match(pageSource, /if \(dataState === "empty"\) \{\s*setCreatingEvent\(true\)/);
  assert.match(pageSource, /if \(result === "empty"\) \{\s*go\("home"\);\s*setCreatingEvent\(true\)/);
});

test("validates invitation details only on the content step or publish", () => {
  assert.match(pageSource, /\(activeStep === 2 \|\| publish\)/);
  assert.match(pageSource, /activeStep === 1 \? \{\s*template:/);
  assert.match(pageSource, /setSaveError\(L\("أكمل اسم العروس واسم العريس وتاريخ الحفل للمتابعة\."/);
});

test("surfaces save errors and locks unreachable future steps", () => {
  assert.match(pageSource, /const \[saveError, setSaveError\]/);
  assert.match(pageSource, /className="builder-error" role="alert"/);
  assert.match(pageSource, /const locked = target > maxStep && target !== step \+ 1/);
  assert.match(pageSource, /disabled=\{locked\}/);
});

test("scopes every event to the authenticated Neon account", () => {
  assert.match(ownerSource, /getPlatformIdentity/);
  assert.match(ownerSource, /Authentication required/);
  assert.match(ownerSource, /user\.email\.toLowerCase\(\)/);
  assert.match(dataSource, /async function ensureOwner/);
  assert.match(dataSource, /eq\(events\.ownerId, ownerId\)/);
});

test("plan selection preserves intent across sign-in", () => {
  assert.match(pageSource, /const choosePlan = \(plan: PlanCode\)/);
  assert.match(pageSource, /encodeURIComponent\(`\/workspace\?plan=\$\{encodeURIComponent\(plan\)\}`\)/);
  assert.match(pageSource, /new URLSearchParams\(window\.location\.search\)\.get\("plan"\)/);
});

test("event creation surfaces server errors instead of a generic validation message", () => {
  assert.match(pageSource, /return \{ ok: false, error: result\?\.error/);
  assert.match(pageSource, /const \[errorMessage, setErrorMessage\]/);
  assert.match(pageSource, /role="alert">\{errorMessage\}/);
});

test("mobile users retain primary navigation and complete template access", () => {
  assert.match(pageSource, /className="mobile-nav"/);
  assert.match(pageSource, /<LayoutDashboard aria-hidden="true"/);
  assert.match(stylesSource, /\.mobile-nav\{position:fixed/);
  assert.match(stylesSource, /\.studio-templates>button:last-child\{display:block!important\}/);
  assert.match(stylesSource, /\.table-row>\.guest-actions\{grid-column:1\/-1/);
});

test("mobile event owners can switch events and reach every dashboard section", () => {
  assert.match(pageSource, /className="dashboard-mobile-context"/);
  assert.match(pageSource, /className="dashboard-mobile-tabs"/);
  assert.match(pageSource, /<UsersRound aria-hidden="true"/);
  assert.match(pageSource, /<MessageSquareText aria-hidden="true"/);
  assert.match(stylesSource, /\.dashboard-mobile-tabs,\.admin-mobile-tabs\{display:flex;overflow-x:auto/);
});

test("studio keeps live preview and progression controls within reach", () => {
  assert.match(pageSource, /className="phone-preview-head"/);
  assert.match(pageSource, /aria-label=\{L\("المعاينة المباشرة للدعوة", "Live invitation preview"\)\}/);
  assert.match(pageSource, /<h1 dir="auto">\{draft\.title\}<\/h1>/);
  assert.match(pageSource, /<p aria-live="polite">/);
  assert.match(stylesSource, /Studio workbench/);
  assert.match(stylesSource, /\.view-studio \.phone-preview\{position:sticky/);
  assert.match(stylesSource, /\.view-studio \.studio-actions\{position:sticky/);
});

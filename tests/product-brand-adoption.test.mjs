import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const home = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const admin = await readFile(new URL("../app/admin-dashboard.tsx", import.meta.url), "utf8");
const invite = await readFile(new URL("../app/invite/[slug]/InvitationClient.tsx", import.meta.url), "utf8");

test("studio and owner dashboard use the shared Wisal product language", () => {
  assert.match(styles, /Product-wide brand adoption/);
  assert.match(styles, /\.view-studio \.app-shell/);
  assert.match(styles, /\.dashboard-page aside,\.admin-sidebar/);
  assert.match(styles, /\.launch-readiness\{background:linear-gradient/);
});

test("admin navigation carries the production monogram", () => {
  assert.match(admin, /from "next\/image"/);
  assert.match(admin, /wisal-monogram-64\.png/);
  assert.match(styles, /\.admin-brand>span img/);
});

test("public invitation opening and footer use real brand assets", () => {
  assert.match(invite, /opening-ornament.*wisal-monogram-64\.png/s);
  assert.match(invite, /envelope-seal.*wisal-monogram-64\.png/s);
  assert.match(invite, /invite-footer.*wisal-monogram-64\.png/s);
  assert.match(styles, /\.public-invite \.guest-cover:not\(\.with-cover\)/);
});

test("responsive and reduced-motion product safeguards remain present", () => {
  assert.match(styles, /@media\(max-width:700px\).*\.dashboard-page,\.admin-page\{display:block\}/s);
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/);
});

test("workspace uses one contextual command bar and direction-safe event titles", () => {
  assert.match(home, /view === "dashboard" \? "workspace-header"/);
  assert.match(home, /className="workspace-breadcrumb"/);
  assert.match(home, /<h1 dir="auto">\{title\}<\/h1>/);
  assert.match(home, /section === "overview" && eventData\?\.event\.status === "published"[\s\S]*onAddGuest/);
  assert.match(styles, /Workspace command bar/);
  assert.match(styles, /\.view-dashboard \.dashboard-page>aside\{position:sticky/);
  assert.match(styles, /unicode-bidi:plaintext/);
});

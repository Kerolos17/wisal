import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("the three signature concepts use dedicated visual previews", async () => {
  const source = await readFile(new URL("app/page.tsx", root), "utf8");
  for (const [name, asset] of [
    ["Élan Editorial", "elan-editorial.webp"],
    ["Garden Reverie", "garden-reverie.webp"],
    ["Afterglow Première", "afterglow-premiere.webp"],
  ]) {
    assert.match(source, new RegExp(name));
    assert.match(source, new RegExp(asset.replace(".", "\\.")));
    await access(new URL(`public/brand/templates/previews/${asset}`, root));
  }
});

test("signature invitations have distinct live layouts and production assets", async () => {
  const source = await readFile(new URL("app/invite/[slug]/InvitationClient.tsx", root), "utf8");
  const styles = await readFile(new URL("app/globals.css", root), "utf8");
  for (const concept of ["editorial", "botanical", "cinematic"]) {
    assert.match(styles, new RegExp(`signature-${concept}`));
    await access(new URL(`public/brand/templates/${concept === "cinematic" ? "cinematic-couple" : `${concept}-background`}-v2.webp`, root));
  }
  assert.match(source, /signature-invite-hero/);
  assert.match(source, /id="invitation-rsvp"/);
  assert.match(source, /scrollIntoView/);
});

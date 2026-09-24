import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("adoption slice 1: hero and header CTAs use the Button component", () => {
  assert.match(page, /import \{ Button \} from "\.\/components\/ui\/Button"/);
  assert.match(page, /<Button size="lg" onClick=\{onStart\}>/);
  assert.match(page, /<Button size="lg" variant="ghost" onClick=\{\(\) => document\.getElementById\("templates"\)/);
  assert.match(page, /<Button className="whitespace-nowrap" variant="ghost" size="sm" onClick=\{\(\) => router\.push\("\/auth\/sign-in/);
  assert.match(page, /<Button className="whitespace-nowrap home-create" size="sm" onClick=\{\(\) => void openStudio\(\)\}>/);
});

test("adoption slice 1: hero actions use Button (gallery CTA stays raw until next slice)", () => {
  const hero = page.match(/<div className="atlas-actions">[\s\S]*?<\/div>/);
  assert.ok(hero, "hero actions block exists");
  assert.doesNotMatch(hero[0], /<button className="atlas-(primary|link)"/);
  assert.match(hero[0], /<Button size="lg"/);
});

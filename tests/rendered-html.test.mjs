import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const productionSocialMeta = /openGraph:\s*\{[\s\S]*images:\s*\[\{\s*url:/i;

test("production sharing metadata is defined without development preview markers", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, productionSocialMeta);
  assert.doesNotMatch(layout, /codex-preview/i);
});

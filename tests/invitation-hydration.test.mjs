import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const client = await readFile(new URL("../app/invite/[slug]/InvitationClient.tsx", import.meta.url), "utf8");

test("invitation clock uses useSyncExternalStore with deterministic server snapshot (no React #418)", () => {
  assert.match(client, /useSyncExternalStore\(/);
  assert.match(client, /\(\) => eventDate\.getTime\(\)/);
  assert.match(client, /setInterval\(onStoreChange, 60000\)/);
});

test("live clock state is not initialized with Date.now() (would mismatch prerender)", () => {
  // openedAt may keep its lazy initializer: it is never rendered, only compared.
  assert.doesNotMatch(client, /const \[now, setNow\] = useState/);
  assert.doesNotMatch(client, /setMounted\(true\)/);
});

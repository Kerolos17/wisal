import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const client = await readFile(new URL("../app/invite/[slug]/InvitationClient.tsx", import.meta.url), "utf8");

test("invitation countdown is mount-gated to prevent hydration mismatch (React #418)", () => {
  assert.match(client, /const \[mounted, setMounted\] = useState\(false\)/);
  assert.match(client, /setMounted\(true\)/);
  assert.match(client, /mounted \? liveCountdown/);
});

test("rsvp deadline state is mount-gated for identical first render", () => {
  assert.match(client, /mounted && Boolean\(deadline/);
});

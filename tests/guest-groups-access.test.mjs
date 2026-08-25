import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const dataSource = await readFile(new URL("../lib/wisal-data.ts", import.meta.url), "utf8");
const invitationSource = await readFile(new URL("../app/invite/[slug]/InvitationClient.tsx", import.meta.url), "utf8");
const collectionRoute = await readFile(new URL("../app/api/events/[id]/guest-groups/route.ts", import.meta.url), "utf8");
const itemRoute = await readFile(new URL("../app/api/events/[id]/guest-groups/[groupId]/route.ts", import.meta.url), "utf8");

test("dashboard manages guest groups and their segment access", () => {
  assert.match(pageSource, /فئات المدعوين/);
  assert.match(pageSource, /GuestGroupModal/);
  assert.match(pageSource, /guestIds/);
  assert.match(pageSource, /segmentIds/);
  assert.match(collectionRoute, /createGuestGroup/);
  assert.match(itemRoute, /updateGuestGroup/);
  assert.match(itemRoute, /deleteGuestGroup/);
});

test("personalized invitations reveal only authorized segments", () => {
  assert.match(dataSource, /effectiveRules\.length \? allSegments\.filter/);
  assert.match(dataSource, /لا تملك هذه الدعوة صلاحية الرد/);
  assert.match(invitationSource, /المراحل المدعوون إليها/);
  assert.match(invitationSource, /data\.segments\.map/);
});

test("RSVP is captured independently for every visible segment", () => {
  assert.match(invitationSource, /segmentResponses/);
  assert.match(invitationSource, /segmentAnswers/);
  assert.match(dataSource, /db\.insert\(segmentRsvps\)/);
  assert.match(dataSource, /segmentRsvps\.guestId, segmentRsvps\.segmentId/);
});

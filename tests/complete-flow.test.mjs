import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const publicInviteSource = await readFile(new URL("../app/invite/[slug]/InvitationClient.tsx", import.meta.url), "utf8");
const eventsRouteSource = await readFile(new URL("../app/api/events/route.ts", import.meta.url), "utf8");
const eventRouteSource = await readFile(new URL("../app/api/events/[id]/route.ts", import.meta.url), "utf8");
const rsvpRouteSource = await readFile(new URL("../app/api/rsvp/route.ts", import.meta.url), "utf8");
const dataSource = await readFile(new URL("../lib/wisal-data.ts", import.meta.url), "utf8");
const ownerSource = await readFile(new URL("../lib/current-owner.ts", import.meta.url), "utf8");

test("new event creation rejects impossible dates on client and server", () => {
  assert.match(pageSource, /Number\.isNaN\(new Date\(form\.eventDate\)\.getTime\(\)\)/);
  assert.match(pageSource, /<input type="date" value=\{form\.eventDate\}/);
  assert.match(eventsRouteSource, /const validDate =/);
  assert.match(eventsRouteSource, /!Number\.isNaN\(new Date\(payload\.eventDate\)\.getTime\(\)\)/);
});

test("publishing is protected by server-side required-field validation", () => {
  assert.match(eventRouteSource, /if \(payload\.status === "published"\)/);
  assert.match(eventRouteSource, /required\.venue\?\.trim\(\)/);
  assert.match(eventRouteSource, /required\.city\?\.trim\(\)/);
  assert.match(eventRouteSource, /أكمل الأسماء والموعد والمكان والمدينة قبل نشر الدعوة/);
});

test("owner guest preview mirrors invitation RSVP configuration", () => {
  assert.match(pageSource, /!invitation\?\.rsvpEnabled/);
  assert.match(pageSource, /invitation\?\.maxPartySize \|\| 1/);
  assert.match(pageSource, /invitation\?\.mealQuestionEnabled/);
  assert.match(pageSource, /rsvpClosed/);
});

test("public invitation handles deadline and server errors clearly", () => {
  assert.match(publicInviteSource, /const rsvpClosed/);
  assert.match(publicInviteSource, /انتهى موعد تأكيد الحضور/);
  assert.match(publicInviteSource, /saveError: "تعذر حفظ الرد/);
  assert.match(publicInviteSource, /result\?\.error \|\| t\.saveError/);
  assert.match(rsvpRouteSource, /expectedError \? 400 : 500/);
  assert.match(dataSource, /Date\.now\(\) > deadline\.getTime\(\)/);
});

test("event APIs return an authentication status instead of a server failure", () => {
  assert.match(ownerSource, /message === "Authentication required"\) return Response\.json\(\{ error: message \}, \{ status: 401 \}\)/);
  assert.match(eventsRouteSource, /ownerApiError/);
});

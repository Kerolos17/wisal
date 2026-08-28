import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schemaSource = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
const dataSource = await readFile(new URL("../lib/wisal-data.ts", import.meta.url), "utf8");
const dashboardSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const invitationPageSource = await readFile(new URL("../app/invite/[slug]/page.tsx", import.meta.url), "utf8");
const invitationClientSource = await readFile(new URL("../app/invite/[slug]/InvitationClient.tsx", import.meta.url), "utf8");
const rsvpRouteSource = await readFile(new URL("../app/api/rsvp/route.ts", import.meta.url), "utf8");
const invitationOpenRouteSource = await readFile(new URL("../app/api/invitation-open/route.ts", import.meta.url), "utf8");

test("guest invitations have durable unique tracking fields", () => {
  assert.match(schemaSource, /inviteToken: uuid\("invite_token"\)/);
  assert.match(schemaSource, /openedAt: timestamp\("opened_at"/);
  assert.match(schemaSource, /respondedAt: timestamp\("responded_at"/);
  assert.match(schemaSource, /guests_invite_token_unique/);
  assert.match(schemaSource, /defaultRandom\(\)/);
});

test("personalized invitation opens are tracked by token", () => {
  assert.match(dataSource, /getInvitationBySlug\(slug: string, inviteToken\?: string\)/);
  assert.match(dataSource, /eq\(guests\.inviteToken, inviteToken\)/);
  assert.match(dataSource, /trackInvitationOpen\(eventId: string, inviteToken: string\)/);
  assert.match(dataSource, /set\(\{ openedAt, updatedAt: openedAt \}\)/);
  assert.match(invitationClientSource, /fetch\("\/api\/invitation-open"/);
  assert.match(invitationOpenRouteSource, /trackInvitationOpen\(eventId, inviteToken\)/);
  assert.match(invitationPageSource, /searchParams: Promise<\{ g\?: string \}>/);
  assert.match(invitationPageSource, /getInvitationBySlug\(slug, g\?\.trim\(\)\)/);
});

test("RSVP uses the personalized token and updates the exact guest", () => {
  assert.match(invitationClientSource, /inviteToken: guest\?\.inviteToken/);
  assert.match(rsvpRouteSource, /inviteToken: payload\.inviteToken\?\.trim\(\)/);
  assert.match(dataSource, /if \(input\.inviteToken && !personalizedGuest\)/);
  assert.match(dataSource, /respondedAt: updatedAt/);
});

test("RSVP validates segment ownership and segment IDs before it mutates a guest", () => {
  const firstGuestWrite = dataSource.indexOf("let savedGuest = personalizedGuest");
  const segmentValidation = dataSource.indexOf("إحدى مراحل المناسبة غير صالحة");
  const accessValidation = dataSource.indexOf("لا تملك هذه الدعوة صلاحية الرد على إحدى المراحل");

  assert.ok(firstGuestWrite > 0);
  assert.ok(segmentValidation > 0 && segmentValidation < firstGuestWrite);
  assert.ok(accessValidation > 0 && accessValidation < firstGuestWrite);
  assert.match(rsvpRouteSource, /"إحدى مراحل المناسبة غير صالحة"/);
  assert.match(rsvpRouteSource, /"لا تملك هذه الدعوة صلاحية الرد على إحدى المراحل"/);
});

test("dashboard exposes copy, WhatsApp sharing, and invitation analytics", () => {
  assert.match(dashboardSource, /\?g=\$\{encodeURIComponent\(guest\.inviteToken\)\}/);
  assert.match(dashboardSource, /navigator\.clipboard\.writeText\(text\)/);
  assert.match(dashboardSource, /document\.execCommand\("copy"\)/);
  assert.match(dashboardSource, /https:\/\/wa\.me\/\$\{destination\}\?text=/);
  assert.match(dashboardSource, /stats\.invitations/);
  assert.match(dashboardSource, /stats\.opened/);
  assert.match(dashboardSource, /stats\.pendingInvitations/);
});

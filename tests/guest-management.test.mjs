import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schemaSource = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
const dataSource = await readFile(new URL("../lib/wisal-data.ts", import.meta.url), "utf8");
const dashboardSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const messageRouteSource = await readFile(new URL("../app/api/events/[id]/messages/route.ts", import.meta.url), "utf8");
const migrationSource = await readFile(new URL("../drizzle/0006_fearless_colonel_america.sql", import.meta.url), "utf8");

test("guest phone numbers persist and support direct WhatsApp sharing", () => {
  assert.match(schemaSource, /phone: text\("phone"\)\.notNull\(\)\.default\(""\)/);
  assert.match(migrationSource, /ALTER TABLE `guests` ADD `phone`/);
  assert.match(dataSource, /phone: input\.phone\?\.trim\(\) \|\| ""/);
  assert.match(dashboardSource, /whatsappNumber\(guest\.phone\)/);
  assert.match(dashboardSource, /https:\/\/wa\.me\/\$\{destination\}/);
});

test("dashboard segments guests by RSVP and invitation engagement", () => {
  assert.match(dashboardSource, /filter === "فتح الدعوة"/);
  assert.match(dashboardSource, /filter === "لم يفتح"/);
  assert.match(dashboardSource, /filter === "تم الرد"/);
  assert.match(dashboardSource, /opened_pending/);
  assert.match(dashboardSource, /unopened/);
  assert.match(messageRouteSource, /"opened_pending", "maybe", "declined"/);
});

test("CSV export includes personalized links and protects spreadsheet cells", () => {
  assert.match(dashboardSource, /function csvCell/);
  assert.match(dashboardSource, /\^\[=\+\\-@\]/);
  assert.match(dashboardSource, /text\/csv;charset=utf-8/);
  assert.match(dashboardSource, /wisal-guests-\$\{eventData\.event\.slug\}\.csv/);
  assert.match(dashboardSource, /invitationUrl\(guest\)/);
});

test("message composer calculates the actual audience across groups and event stages", () => {
  assert.match(dashboardSource, /const getRecipientSummary = \(audience: MessageAudience, groupId: string \| null, segmentId: string \| null\)/);
  assert.match(dashboardSource, /openCompose\("pending", null, item\.segment\.id\)/);
  assert.match(dashboardSource, /getRecipientSummary=\{getRecipientSummary\}/);
  assert.match(dashboardSource, /Current audience:/);
});

test("saved messages become an explicit manual WhatsApp follow-up queue", () => {
  assert.match(dashboardSource, /WhatsAppQueueModal/);
  assert.match(dashboardSource, /Wisal never sends these messages automatically/);
  assert.match(dashboardSource, /replaceAll\("\{name\}"/);
  assert.match(dashboardSource, /replaceAll\("\{link\}"/);
  assert.match(dashboardSource, /setCompletedIds/);
});

test("guest workflow separates unopened, opened-pending, and responded invitations", () => {
  assert.match(dashboardSource, /follow-up-strip/);
  assert.match(dashboardSource, /filter === "فتح ولم يرد"/);
  assert.match(dashboardSource, /Not opened — send invitation/);
  assert.match(dashboardSource, /Opened, no reply — follow up gently/);
});

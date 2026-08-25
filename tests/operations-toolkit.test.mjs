import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const dataSource = await readFile(new URL("../lib/wisal-data.ts", import.meta.url), "utf8");
const schemaSource = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
const importRoute = await readFile(new URL("../app/api/events/[id]/guests/import/route.ts", import.meta.url), "utf8");
const migration = await readFile(new URL("../docs/database/0008_message_targeting.sql", import.meta.url), "utf8");

test("dashboard reports attendance independently for every segment", () => {
  assert.match(pageSource, /الحضور حسب المرحلة/);
  assert.match(pageSource, /segmentStats/);
  assert.match(pageSource, /segmentRsvps\.filter/);
  assert.match(pageSource, /بانتظار الرد/);
});

test("CSV import previews rows and persists a bounded bulk operation", () => {
  assert.match(pageSource, /parseCsv/);
  assert.match(pageSource, /ImportGuestsModal/);
  assert.match(pageSource, /حتى 500 ضيف/);
  assert.match(importRoute, /payload\.rows\.length > 500/);
  assert.match(dataSource, /excluded\.phone/);
  assert.match(dataSource, /guestGroupMemberships/);
});

test("messages can target a guest group and an event segment", () => {
  assert.match(schemaSource, /groupId: uuid\("group_id"\)/);
  assert.match(schemaSource, /segmentId: uuid\("segment_id"\)/);
  assert.match(dataSource, /فئة المدعوين غير صالحة/);
  assert.match(dataSource, /مرحلة المناسبة غير صالحة/);
  assert.match(pageSource, /تجهيز رسالة مخصصة/);
});

test("message targeting migration is additive and indexed", () => {
  assert.match(migration, /ADD COLUMN IF NOT EXISTS group_id/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS segment_id/);
  assert.match(migration, /messages_event_group_idx/);
  assert.match(migration, /messages_event_segment_idx/);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|TRUNCATE/);
});

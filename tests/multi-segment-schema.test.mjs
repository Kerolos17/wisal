import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schemaSource = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
const migrationSource = await readFile(new URL("../docs/database/0007_multi_segment_foundation.sql", import.meta.url), "utf8");

test("models event segments, guest groups, access, and per-segment RSVP", () => {
  for (const entity of ["eventSegments", "guestGroups", "guestGroupMemberships", "guestSegmentAccess", "segmentRsvps"]) {
    assert.match(schemaSource, new RegExp(`export const ${entity}`));
  }
  assert.match(schemaSource, /num_nonnulls/);
  assert.match(schemaSource, /enabledLocales/);
});

test("migration is additive and preserves current event-level fields", () => {
  assert.match(migrationSource, /ADD COLUMN IF NOT EXISTS default_locale/);
  assert.match(migrationSource, /CREATE TABLE IF NOT EXISTS event_segments/);
  assert.match(migrationSource, /CREATE TABLE IF NOT EXISTS guest_segment_access/);
  assert.match(migrationSource, /CREATE TABLE IF NOT EXISTS segment_rsvps/);
  assert.doesNotMatch(migrationSource, /DROP TABLE|DROP COLUMN|TRUNCATE/);
});

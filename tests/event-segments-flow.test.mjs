import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const dataSource = await readFile(new URL("../lib/wisal-data.ts", import.meta.url), "utf8");
const collectionRoute = await readFile(new URL("../app/api/events/[id]/segments/route.ts", import.meta.url), "utf8");
const itemRoute = await readFile(new URL("../app/api/events/[id]/segments/[segmentId]/route.ts", import.meta.url), "utf8");

test("studio manages event segments through dedicated APIs", () => {
  assert.match(pageSource, /مراحل المناسبة/);
  assert.match(pageSource, /SegmentModal/);
  assert.match(pageSource, /\/segments\/\$\{editing\.id\}/);
  assert.match(collectionRoute, /createEventSegment/);
  assert.match(itemRoute, /updateEventSegment/);
  assert.match(itemRoute, /deleteEventSegment/);
});

test("event overview backfills one compatible segment and prevents deleting the last", () => {
  assert.match(dataSource, /if \(!segmentRows\.length\)/);
  assert.match(dataSource, /event\.eventDate/);
  assert.match(dataSource, /current\.length <= 1/);
  assert.match(dataSource, /مرحلة واحدة على الأقل/);
});

test("segment validation requires a name, time, venue, and city", () => {
  assert.match(collectionRoute, /!payload\.title\?\.trim\(\)/);
  assert.match(collectionRoute, /!payload\.startsAt/);
  assert.match(collectionRoute, /!payload\.venueName\?\.trim\(\)/);
  assert.match(collectionRoute, /!payload\.city\?\.trim\(\)/);
});

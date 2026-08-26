import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataSource = await readFile(new URL("../lib/wisal-data.ts", import.meta.url), "utf8");
const drizzleConfig = await readFile(new URL("../drizzle.config.ts", import.meta.url), "utf8");

test("workspace event reads are scoped to the authenticated owner", () => {
  assert.doesNotMatch(dataSource, /ensureDemoEvent|DEMO_EVENT_ID|demoGuests/);
  assert.match(dataSource, /eq\(events\.ownerId, ownerId\)/);
  assert.match(dataSource, /eq\(events\.id, eventId\), eq\(events\.ownerId, ownerId\)/);
  assert.match(dataSource, /export async function listEvents\(ownerEmail: string\)/);
});

test("public RSVP writes require an explicit event", () => {
  assert.match(dataSource, /eventId: string;/);
  assert.match(dataSource, /if \(!input\.eventId\?\.trim\(\)\) throw new Error\("المناسبة مطلوبة"\)/);
  assert.doesNotMatch(dataSource, /input\.eventId \|\|/);
});

test("Drizzle migration generation matches the Neon PostgreSQL runtime", () => {
  assert.match(drizzleConfig, /dialect: "postgresql"/);
  assert.match(drizzleConfig, /url: process\.env\.DATABASE_URL/);
});

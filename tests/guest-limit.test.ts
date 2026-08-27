import { describe, it, after } from "node:test";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { getDb } from "@/db";
import { users, events, guests, userSubscriptions } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { addGuest, importGuests, createEvent } from "@/lib/wisal-data";
import { getGuestLimitForOwnerEmail, getGuestLimitForUser } from "@/lib/payments";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required for guest-limit tests");

function fakeEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

describe("guest limit enforcement (Phase 1.1)", () => {
  const createdUserIds: string[] = [];
  const createdEventIds: string[] = [];

  async function makeUser(email: string, planCode?: "starter" | "signature") {
    await getDb().insert(users).values({ email, displayName: "GL", role: "couple" }).onConflictDoNothing();
    const [u] = await getDb().select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (!u) throw new Error("user create failed");
    if (planCode) {
      const startsAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      await getDb().insert(userSubscriptions).values({
        userId: u.id,
        planCode,
        status: "active",
        startsAt,
        expiresAt,
      }).onConflictDoNothing();
    }
    createdUserIds.push(u.id);
    return u.id;
  }

  async function makeEvent(ownerEmail: string) {
    const overview = await createEvent(ownerEmail, { title: "T", brideName: "A", groomName: "B", venue: "V", city: "Cairo", eventDate: "2030-01-01" });
    if (!overview?.event?.id) throw new Error("event create failed");
    createdEventIds.push(overview.event.id);
    return overview.event.id;
  }

  after(async () => {
    const db = getDb();
    for (const id of createdEventIds) {
      await db.delete(guests).where(eq(guests.eventId, id)).catch(() => {});
      await db.delete(events).where(eq(events.id, id)).catch(() => {});
    }
    for (const id of createdUserIds) {
      await db.delete(userSubscriptions).where(eq(userSubscriptions.userId, id)).catch(() => {});
      await db.delete(users).where(eq(users.id, id)).catch(() => {});
    }
  });

  it("defaults to starter guest limit (50) when no subscription", async () => {
    const email = fakeEmail("nofree");
    const id = await makeUser(email);
    const limit = await getGuestLimitForUser(id);
    assert.equal(limit, 50);
    const limitByEmail = await getGuestLimitForOwnerEmail(email);
    assert.equal(limitByEmail, 50);
  });

  it("signature plan is unlimited (null)", async () => {
    const email = fakeEmail("sig");
    const id = await makeUser(email, "signature");
    const limit = await getGuestLimitForUser(id);
    assert.equal(limit, null);
  });

  it("blocks adding a guest past the starter limit", async () => {
    const email = fakeEmail("blockadd");
    await makeUser(email);
    const eventId = await makeEvent(email);
    await getDb().insert(guests).values(
      Array.from({ length: 50 }, (_, i) => ({ eventId, inviteToken: randomUUID(), name: `G${i}`, updatedAt: new Date().toISOString() })),
    );
    const [row] = await getDb().select({ value: count() }).from(guests).where(eq(guests.eventId, eventId));
    assert.equal(Number(row.value), 50);
    await assert.rejects(
      () => addGuest(email, eventId, { name: "OverTheLimit" }),
      (err) => { assert.equal((err as { code?: string }).code, "GUEST_LIMIT"); return true; },
    );
  });

  it("blocks importing guests past the starter limit", async () => {
    const email = fakeEmail("blockimp");
    await makeUser(email);
    const eventId = await makeEvent(email);
    await getDb().insert(guests).values(
      Array.from({ length: 40 }, (_, i) => ({ eventId, inviteToken: randomUUID(), name: `Seed${i}`, updatedAt: new Date().toISOString() })),
    );
    await assert.rejects(
      () => importGuests(email, eventId, Array.from({ length: 20 }, (_, i) => ({ name: `Imp${i}` }))),
      (err) => { assert.equal((err as { code?: string }).code, "GUEST_LIMIT"); return true; },
    );
    // unchanged count
    const [row] = await getDb().select({ value: count() }).from(guests).where(eq(guests.eventId, eventId));
    assert.equal(Number(row.value), 40);
  });

  it("allows unlimited guests on signature plan", async () => {
    const email = fakeEmail("unl");
    await makeUser(email, "signature");
    const eventId = await makeEvent(email);
    await getDb().insert(guests).values(
      Array.from({ length: 120 }, (_, i) => ({ eventId, inviteToken: randomUUID(), name: `Big${i}`, updatedAt: new Date().toISOString() })),
    );
    const [row] = await getDb().select({ value: count() }).from(guests).where(eq(guests.eventId, eventId));
    assert.equal(Number(row.value), 120);
    // still allowed to add one more past a small count via addGuest
    await addGuest(email, eventId, { name: "Extra" });
    const [row2] = await getDb().select({ value: count() }).from(guests).where(eq(guests.eventId, eventId));
    assert.equal(Number(row2.value), 121);
  });
});


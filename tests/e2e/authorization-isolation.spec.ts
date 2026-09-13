import { expect, request as playwrightRequest, test, type APIRequestContext } from "@playwright/test";

const enabled = process.env.E2E_MUTABLE_AUTHORIZATION === "enabled";
const token = process.env.WISAL_E2E_TEST_TOKEN ?? "";
const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

function identityHeaders(name: "owner-a" | "owner-b") {
  return {
    "x-wisal-e2e-token": token,
    "x-wisal-e2e-identity": `wisal-e2e-${name}@example.invalid`,
  };
}

async function createEvent(context: APIRequestContext, suffix: string) {
  const response = await context.post("/api/events", {
    data: {
      title: `WISAL E2E ${suffix}`,
      brideName: `Owner ${suffix}`,
      groomName: "Isolation",
      eventDate: "2030-12-31",
      venue: "E2E Test Venue",
      city: "E2E Test City",
      template: "قصيدة حب",
    },
  });
  expect(response.status()).toBe(201);
  return await response.json() as { event: { id: string }; guests: Array<{ inviteToken: string }> };
}

test.describe("mutable authorization isolation", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(180_000);
  test.skip(!enabled, "Set E2E_MUTABLE_AUTHORIZATION=enabled on an isolated non-production database.");

  test("owner B cannot discover, read, or mutate owner A's event", async () => {
    const ownerA = await playwrightRequest.newContext({ baseURL, extraHTTPHeaders: identityHeaders("owner-a") });
    const ownerB = await playwrightRequest.newContext({ baseURL, extraHTTPHeaders: identityHeaders("owner-b") });
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      const created = await createEvent(ownerA, suffix);
      const eventId = created.event.id;

      const list = await ownerB.get("/api/events");
      expect(list.status()).toBe(200);
      const listPayload = await list.json() as { events: Array<{ id: string }> };
      expect(listPayload.events.map((event) => event.id)).not.toContain(eventId);

      const read = await ownerB.get(`/api/events/${eventId}`);
      expect(read.status()).toBe(404);
      expect((await read.json()) as Record<string, unknown>).not.toHaveProperty("event");

      const patch = await ownerB.patch(`/api/events/${eventId}`, { data: { title: "Unauthorized mutation" } });
      expect(patch.status()).toBe(404);

      const guest = await ownerB.post(`/api/events/${eventId}/guests`, { data: { name: "Unauthorized guest" } });
      expect(guest.status()).toBe(404);

      const message = await ownerB.post(`/api/events/${eventId}/messages`, { data: { title: "Unauthorized", body: "Must not persist" } });
      expect(message.status()).toBe(404);

      const ownerRead = await ownerA.get(`/api/events/${eventId}`);
      expect(ownerRead.status()).toBe(200);
      const ownerPayload = await ownerRead.json() as { event: { title: string }; guests: Array<{ name: string }>; messages: Array<{ title: string }> };
      expect(ownerPayload.event.title).toBe(`WISAL E2E ${suffix}`);
      expect(ownerPayload.guests.map((item) => item.name)).not.toContain("Unauthorized guest");
      expect(ownerPayload.messages.map((item) => item.title)).not.toContain("Unauthorized");
    } finally {
      await ownerA.dispose();
      await ownerB.dispose();
    }
  });

  test("a normal owner cannot enter the administration API", async () => {
    const owner = await playwrightRequest.newContext({ baseURL, extraHTTPHeaders: identityHeaders("owner-b") });
    try {
      const response = await owner.get("/api/admin/overview");
      expect(response.status()).toBe(403);
      expect(await response.json()).toEqual({ error: "Forbidden" });
    } finally {
      await owner.dispose();
    }
  });
});

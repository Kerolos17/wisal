import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { activityLogs, eventSegments, events, guestGroupMemberships, guestGroups, guests, guestSegmentAccess, invitations, messages, segmentRsvps, users } from "@/db/schema";
import { getActiveSubscription, getGuestLimitForOwnerEmail } from "@/lib/payments";
import { isPaidPlanCode, isPremiumTemplateCode } from "@/lib/template-entitlements";

function createInviteToken() {
  return crypto.randomUUID();
}

async function ensureOwner(ownerEmail: string) {
  const db = getDb();
  await db.insert(users).values({ email: ownerEmail, displayName: ownerEmail.split("@")[0] || "Wisal Owner" }).onConflictDoNothing({ target: users.email });
  const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.email, ownerEmail)).limit(1);
  if (!owner) throw new Error("تعذر إنشاء حساب مالك الدعوة");
  return owner.id;
}

export type EventInput = {
  title: string;
  brideName: string;
  groomName: string;
  eventDate: string;
  venue: string;
  city: string;
  mapUrl?: string;
  template?: string;
  message?: string;
  rsvpDeadline?: string;
  accentColor?: string;
  fontStyle?: string;
  openingStyle?: "envelope" | "card" | "curtain";
  layoutStyle?: "classic" | "story" | "cinematic";
  showMessage?: boolean;
  showCountdown?: boolean;
  showSchedule?: boolean;
  sectionOrder?: string[];
  rsvpEnabled?: boolean;
  mealQuestionEnabled?: boolean;
  maxPartySize?: number;
  coverImageKey?: string | null;
  status?: "draft" | "published" | "archived";
};

export type EventSegmentInput = {
  title: string;
  kind: "ceremony" | "reception" | "dinner" | "party" | "session" | "other";
  startsAt: string;
  endsAt?: string | null;
  venueName: string;
  city: string;
  address?: string;
  mapUrl?: string;
  position?: number;
};

export type GuestGroupInput = {
  name: string;
  description?: string;
  guestIds?: string[];
  segmentIds?: string[];
  partyLimit?: number;
};

async function ensureGuestInviteTokens(eventId: string) {
  const db = getDb();
  const rows = await db.select({ id: guests.id, inviteToken: guests.inviteToken }).from(guests).where(eq(guests.eventId, eventId));
  await Promise.all(rows.filter((guest) => !guest.inviteToken).map((guest) =>
    db.update(guests).set({ inviteToken: createInviteToken() }).where(eq(guests.id, guest.id))
  ));
}

async function overviewForEvent(eventId: string) {
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return null;
  await ensureGuestInviteTokens(eventId);
  const [invitation] = await db.select().from(invitations).where(eq(invitations.eventId, eventId)).limit(1);
  const guestRows = await db.select().from(guests).where(eq(guests.eventId, eventId)).orderBy(desc(guests.updatedAt));
  const activityRows = await db.select().from(activityLogs).where(eq(activityLogs.eventId, eventId)).orderBy(desc(activityLogs.createdAt)).limit(40);
  const messageRows = await db.select().from(messages).where(eq(messages.eventId, eventId)).orderBy(desc(messages.createdAt)).limit(30);
  let segmentRows = await db.select().from(eventSegments).where(eq(eventSegments.eventId, eventId)).orderBy(asc(eventSegments.position), asc(eventSegments.startsAt));
  if (!segmentRows.length) {
    await db.insert(eventSegments).values({
      eventId,
      title: "المناسبة الرئيسية",
      kind: "other",
      startsAt: event.eventDate,
      venueName: event.venue,
      city: event.city,
      mapUrl: event.mapUrl,
      position: 0,
    });
    segmentRows = await db.select().from(eventSegments).where(eq(eventSegments.eventId, eventId)).orderBy(asc(eventSegments.position), asc(eventSegments.startsAt));
  }
  const groupRows = await db.select().from(guestGroups).where(eq(guestGroups.eventId, eventId)).orderBy(asc(guestGroups.createdAt));
  const groupIds = groupRows.map((group) => group.id);
  const segmentIds = segmentRows.map((segment) => segment.id);
  const membershipRows = groupIds.length ? await db.select().from(guestGroupMemberships).where(inArray(guestGroupMemberships.groupId, groupIds)) : [];
  const accessRows = segmentIds.length ? await db.select().from(guestSegmentAccess).where(inArray(guestSegmentAccess.segmentId, segmentIds)) : [];
  const segmentRsvpRows = segmentIds.length ? await db.select().from(segmentRsvps).where(inArray(segmentRsvps.segmentId, segmentIds)) : [];
  const stats = guestRows.reduce((result, guest) => {
    result.invitations += 1;
    result.seats += guest.partySize;
    result.total += guest.partySize;
    result[guest.status] += guest.partySize;
    if (guest.openedAt) result.opened += 1;
    if (guest.status !== "pending") result.responded += 1;
    if (guest.status === "pending") result.pendingInvitations += 1;
    return result;
  }, { total: 0, invitations: 0, seats: 0, opened: 0, responded: 0, pendingInvitations: 0, yes: 0, maybe: 0, pending: 0, no: 0 });
  const enrichedGroups = groupRows.map((group) => ({
    ...group,
    guestIds: membershipRows.filter((membership) => membership.groupId === group.id).map((membership) => membership.guestId),
    segmentIds: accessRows.filter((access) => access.groupId === group.id && access.invited).map((access) => access.segmentId),
    partyLimit: accessRows.find((access) => access.groupId === group.id)?.partyLimit ?? 1,
  }));
  return { event, invitation, segments: segmentRows, guestGroups: enrichedGroups, segmentRsvps: segmentRsvpRows, guests: guestRows, activity: activityRows, messages: messageRows, stats };
}

export async function getEventOverview(eventId: string | undefined, ownerEmail: string) {
  const db = getDb();
  const ownerId = await ensureOwner(ownerEmail);
  const [event] = eventId
    ? await db.select().from(events).where(and(eq(events.id, eventId), eq(events.ownerId, ownerId))).limit(1)
    : await db.select().from(events).where(eq(events.ownerId, ownerId)).orderBy(desc(events.updatedAt)).limit(1);
  if (!event) return null;
  return overviewForEvent(event.id);
}

export async function listEvents(ownerEmail: string) {
  const db = getDb();
  const ownerId = await ensureOwner(ownerEmail);
  const eventRows = await db.select().from(events).where(eq(events.ownerId, ownerId)).orderBy(desc(events.updatedAt));
  return Promise.all(eventRows.map(async (event) => {
    const overview = await overviewForEvent(event.id);
    return { ...event, stats: overview?.stats ?? { total: 0, invitations: 0, seats: 0, opened: 0, responded: 0, pendingInvitations: 0, yes: 0, maybe: 0, pending: 0, no: 0 } };
  }));
}

function safeText(value: string | undefined, fallback: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed || fallback;
}

function slugPart(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cairoDateTime(value: string) {
  const localValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T19:00` : value;
  if (/Z$|[+-]\d{2}:\d{2}$/.test(localValue)) return localValue;
  const datePart = localValue.slice(0, 10);
  const zonePart = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", timeZoneName: "longOffset" }).formatToParts(new Date(`${datePart}T12:00:00Z`)).find((part) => part.type === "timeZoneName")?.value ?? "GMT+02:00";
  const match = zonePart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  const offset = match ? `${match[1]}${match[2].padStart(2, "0")}:${match[3] ?? "00"}` : "+02:00";
  return `${localValue}:00${offset}`;
}

export async function createEvent(ownerEmail: string, input: EventInput) {
  const db = getDb();
  const ownerId = await ensureOwner(ownerEmail);
  if (isPremiumTemplateCode(input.template) && !isPaidPlanCode((await getActiveSubscription(ownerId))?.planCode)) {
    throw Object.assign(new Error("هذه التجربة متاحة فقط في الباقات المدفوعة"), { code: "FORBIDDEN" });
  }
  const id = crypto.randomUUID();
  const token = id.replaceAll("-", "").slice(0, 8);
  const coupleSlug = [slugPart(input.brideName), slugPart(input.groomName)].filter(Boolean).join("-");
  const slug = `${coupleSlug || "joy"}-${token}`;
  const now = new Date().toISOString();
  const eventDate = cairoDateTime(input.eventDate);
  await db.insert(events).values({
    id,
    ownerId,
    title: safeText(input.title, `زفاف ${input.brideName} و${input.groomName}`),
    brideName: safeText(input.brideName, "العروس"),
    groomName: safeText(input.groomName, "العريس"),
    eventDate,
    venue: safeText(input.venue, "يُحدد لاحقًا"),
    city: safeText(input.city, "القاهرة"),
    mapUrl: safeText(input.mapUrl, ""),
    slug,
    status: "draft",
    updatedAt: now,
  });
  await db.insert(invitations).values({
    id: crypto.randomUUID(),
    eventId: id,
    template: input.template || "قصيدة حب",
    message: input.message || "بكل الحب والفرح، يسعدنا أن تشاركونا بداية حكايتنا الجديدة.",
    rsvpDeadline: input.rsvpDeadline || input.eventDate.slice(0, 10),
    openingStyle: input.openingStyle || "envelope",
    layoutStyle: input.layoutStyle || "classic",
    sectionOrder: ["message", "countdown", "schedule", "rsvp"],
  });
  await db.insert(activityLogs).values({ eventId: id, actor: ownerEmail, action: "event_created", details: { title: input.title } });
  return overviewForEvent(id);
}

export async function updateEvent(ownerEmail: string, eventId: string, input: Partial<EventInput>) {
  const db = getDb();
  const ownerId = await ensureOwner(ownerEmail);
  const [existing] = await db.select().from(events).where(and(eq(events.id, eventId), eq(events.ownerId, ownerId))).limit(1);
  if (!existing) return null;
  if (isPremiumTemplateCode(input.template) && !isPaidPlanCode((await getActiveSubscription(ownerId))?.planCode)) {
    throw Object.assign(new Error("هذه التجربة متاحة فقط في الباقات المدفوعة"), { code: "FORBIDDEN" });
  }
  const eventPatch: Partial<typeof events.$inferInsert> = { updatedAt: new Date().toISOString() };
  for (const key of ["title", "brideName", "groomName", "eventDate", "venue", "city", "mapUrl", "status"] as const) {
    if (input[key] !== undefined) Object.assign(eventPatch, { [key]: input[key] });
  }
  if (input.eventDate) eventPatch.eventDate = cairoDateTime(input.eventDate);
  if (input.status === "published") eventPatch.publishedAt = new Date().toISOString();
  await db.update(events).set(eventPatch).where(eq(events.id, eventId));

  const invitationPatch: Partial<typeof invitations.$inferInsert> = {};
  for (const key of ["template", "message", "rsvpDeadline", "accentColor", "fontStyle", "openingStyle", "layoutStyle", "showMessage", "showCountdown", "showSchedule", "sectionOrder", "rsvpEnabled", "mealQuestionEnabled", "maxPartySize", "coverImageKey"] as const) {
    if (input[key] !== undefined) Object.assign(invitationPatch, { [key]: input[key] });
  }
  if (Object.keys(invitationPatch).length) await db.update(invitations).set(invitationPatch).where(eq(invitations.eventId, eventId));
  await db.insert(activityLogs).values({ eventId, actor: ownerEmail, action: input.status === "published" ? "invitation_published" : "invitation_updated", details: input });
  return overviewForEvent(eventId);
}

async function ownedEvent(ownerEmail: string, eventId: string) {
  const db = getDb();
  const ownerId = await ensureOwner(ownerEmail);
  return (await db.select().from(events).where(and(eq(events.id, eventId), eq(events.ownerId, ownerId))).limit(1))[0] ?? null;
}

export async function createEventSegment(ownerEmail: string, eventId: string, input: EventSegmentInput) {
  const db = getDb();
  if (!await ownedEvent(ownerEmail, eventId)) return null;
  const existing = await db.select({ id: eventSegments.id }).from(eventSegments).where(eq(eventSegments.eventId, eventId));
  await db.insert(eventSegments).values({
    eventId,
    title: input.title.trim(),
    kind: input.kind,
    startsAt: cairoDateTime(input.startsAt),
    endsAt: input.endsAt ? cairoDateTime(input.endsAt) : null,
    venueName: input.venueName.trim(),
    city: input.city.trim(),
    address: input.address?.trim() || "",
    mapUrl: input.mapUrl?.trim() || "",
    position: input.position ?? existing.length,
  });
  await db.insert(activityLogs).values({ eventId, actor: ownerEmail, action: "event_segment_added", details: { title: input.title } });
  return overviewForEvent(eventId);
}

export async function updateEventSegment(ownerEmail: string, eventId: string, segmentId: string, input: Partial<EventSegmentInput>) {
  const db = getDb();
  if (!await ownedEvent(ownerEmail, eventId)) return null;
  const patch: Partial<typeof eventSegments.$inferInsert> = { updatedAt: new Date().toISOString() };
  if (input.title?.trim()) patch.title = input.title.trim();
  if (input.kind) patch.kind = input.kind;
  if (input.startsAt) patch.startsAt = cairoDateTime(input.startsAt);
  if (input.endsAt !== undefined) patch.endsAt = input.endsAt ? cairoDateTime(input.endsAt) : null;
  if (input.venueName !== undefined) patch.venueName = input.venueName.trim();
  if (input.city !== undefined) patch.city = input.city.trim();
  if (input.address !== undefined) patch.address = input.address.trim();
  if (input.mapUrl !== undefined) patch.mapUrl = input.mapUrl.trim();
  if (input.position !== undefined) patch.position = Math.max(0, input.position);
  await db.update(eventSegments).set(patch).where(and(eq(eventSegments.id, segmentId), eq(eventSegments.eventId, eventId)));
  await db.insert(activityLogs).values({ eventId, actor: ownerEmail, action: "event_segment_updated", details: { segmentId, title: input.title } });
  return overviewForEvent(eventId);
}

export async function deleteEventSegment(ownerEmail: string, eventId: string, segmentId: string) {
  const db = getDb();
  if (!await ownedEvent(ownerEmail, eventId)) return null;
  const current = await db.select({ id: eventSegments.id }).from(eventSegments).where(eq(eventSegments.eventId, eventId));
  if (current.length <= 1) throw new Error("يجب أن تحتوي المناسبة على مرحلة واحدة على الأقل");
  await db.delete(eventSegments).where(and(eq(eventSegments.id, segmentId), eq(eventSegments.eventId, eventId)));
  await db.insert(activityLogs).values({ eventId, actor: ownerEmail, action: "event_segment_deleted", details: { segmentId } });
  return overviewForEvent(eventId);
}

async function validateGroupAudience(eventId: string, input: GuestGroupInput) {
  const db = getDb();
  const guestIds = [...new Set(input.guestIds ?? [])];
  const segmentIds = [...new Set(input.segmentIds ?? [])];
  const validGuests = guestIds.length ? await db.select({ id: guests.id }).from(guests).where(and(eq(guests.eventId, eventId), inArray(guests.id, guestIds))) : [];
  const validSegments = segmentIds.length ? await db.select({ id: eventSegments.id }).from(eventSegments).where(and(eq(eventSegments.eventId, eventId), inArray(eventSegments.id, segmentIds))) : [];
  if (validGuests.length !== guestIds.length || validSegments.length !== segmentIds.length) throw new Error("بعض الضيوف أو المراحل لا تنتمي إلى هذه المناسبة");
  return { guestIds, segmentIds };
}

async function replaceGroupRules(eventId: string, groupId: string, input: GuestGroupInput) {
  const db = getDb();
  const { guestIds, segmentIds } = await validateGroupAudience(eventId, input);
  const currentMemberships = await db.select({ guestId: guestGroupMemberships.guestId }).from(guestGroupMemberships).where(eq(guestGroupMemberships.groupId, groupId));
  const affectedGuestIds = [...new Set([...currentMemberships.map((row) => row.guestId), ...guestIds])];
  if (affectedGuestIds.length) await db.delete(guestGroupMemberships).where(inArray(guestGroupMemberships.guestId, affectedGuestIds));
  await db.delete(guestSegmentAccess).where(eq(guestSegmentAccess.groupId, groupId));
  if (guestIds.length) await db.insert(guestGroupMemberships).values(guestIds.map((guestId) => ({ guestId, groupId })));
  if (segmentIds.length) await db.insert(guestSegmentAccess).values(segmentIds.map((segmentId) => ({ segmentId, groupId, invited: true, partyLimit: Math.max(1, Math.min(10, input.partyLimit ?? 1)) })));
}

export async function createGuestGroup(ownerEmail: string, eventId: string, input: GuestGroupInput) {
  const db = getDb();
  if (!await ownedEvent(ownerEmail, eventId)) return null;
  const groupId = crypto.randomUUID();
  await db.insert(guestGroups).values({ id: groupId, eventId, name: input.name.trim(), description: input.description?.trim() || "" });
  await replaceGroupRules(eventId, groupId, input);
  await db.insert(activityLogs).values({ eventId, actor: ownerEmail, action: "guest_group_added", details: { groupId, name: input.name } });
  return overviewForEvent(eventId);
}

export async function updateGuestGroup(ownerEmail: string, eventId: string, groupId: string, input: GuestGroupInput) {
  const db = getDb();
  if (!await ownedEvent(ownerEmail, eventId)) return null;
  const [group] = await db.select().from(guestGroups).where(and(eq(guestGroups.id, groupId), eq(guestGroups.eventId, eventId))).limit(1);
  if (!group) return null;
  await db.update(guestGroups).set({ name: input.name.trim(), description: input.description?.trim() || "", updatedAt: new Date().toISOString() }).where(eq(guestGroups.id, groupId));
  await replaceGroupRules(eventId, groupId, input);
  await db.insert(activityLogs).values({ eventId, actor: ownerEmail, action: "guest_group_updated", details: { groupId, name: input.name } });
  return overviewForEvent(eventId);
}

export async function deleteGuestGroup(ownerEmail: string, eventId: string, groupId: string) {
  const db = getDb();
  if (!await ownedEvent(ownerEmail, eventId)) return null;
  await db.delete(guestGroups).where(and(eq(guestGroups.id, groupId), eq(guestGroups.eventId, eventId)));
  await db.insert(activityLogs).values({ eventId, actor: ownerEmail, action: "guest_group_deleted", details: { groupId } });
  return overviewForEvent(eventId);
}

export async function createMessage(ownerEmail: string, eventId: string, input: { title: string; body: string; audience?: "all" | "pending" | "confirmed" | "unopened" | "opened_pending" | "maybe" | "declined"; scheduledAt?: string; groupId?: string | null; segmentId?: string | null }) {
  const db = getDb();
  const ownerId = await ensureOwner(ownerEmail);
  const [event] = await db.select().from(events).where(and(eq(events.id, eventId), eq(events.ownerId, ownerId))).limit(1);
  if (!event) return null;
  if (input.groupId) {
    const [group] = await db.select({ id: guestGroups.id }).from(guestGroups).where(and(eq(guestGroups.id, input.groupId), eq(guestGroups.eventId, eventId))).limit(1);
    if (!group) throw new Error("فئة المدعوين غير صالحة لهذه المناسبة");
  }
  if (input.segmentId) {
    const [segment] = await db.select({ id: eventSegments.id }).from(eventSegments).where(and(eq(eventSegments.id, input.segmentId), eq(eventSegments.eventId, eventId))).limit(1);
    if (!segment) throw new Error("مرحلة المناسبة غير صالحة");
  }
  const scheduledAt = input.scheduledAt?.trim() || null;
  await db.insert(messages).values({
    eventId,
    title: input.title.trim(),
    body: input.body.trim(),
    audience: input.audience ?? "all",
    groupId: input.groupId || null,
    segmentId: input.segmentId || null,
    status: scheduledAt ? "scheduled" : "draft",
    scheduledAt,
  });
  await db.insert(activityLogs).values({ eventId, actor: ownerEmail, action: scheduledAt ? "message_scheduled" : "message_drafted", details: { title: input.title, audience: input.audience ?? "all", groupId: input.groupId, segmentId: input.segmentId } });
  return overviewForEvent(eventId);
}

export async function importGuests(ownerEmail: string, eventId: string, rows: Array<{ name: string; phone?: string; partySize?: number; groupId?: string | null }>) {
  const db = getDb();
  if (!await ownedEvent(ownerEmail, eventId)) return null;
  const validRows = rows.slice(0, 500).map((row) => ({ name: row.name.trim(), phone: row.phone?.trim() || "", partySize: Math.max(1, Math.min(10, Number(row.partySize) || 1)), groupId: row.groupId || null })).filter((row) => row.name.length >= 2);
  const normalized = [...new Map(validRows.map((row) => [row.name.toLocaleLowerCase("ar"), row])).values()];
  const groupIds = [...new Set(normalized.map((row) => row.groupId).filter((value): value is string => Boolean(value)))];
  if (groupIds.length) {
    const validGroups = await db.select({ id: guestGroups.id }).from(guestGroups).where(and(eq(guestGroups.eventId, eventId), inArray(guestGroups.id, groupIds)));
    if (validGroups.length !== groupIds.length) throw new Error("مجموعة غير صالحة للضيوف");
  }
  const limit = await getGuestLimitForOwnerEmail(ownerEmail);
  if (limit !== null) {
    const [row] = await db.select({ value: count() }).from(guests).where(eq(guests.eventId, eventId));
    if (Number(row.value) + normalized.length > limit) {
      throw Object.assign(new Error("تجاوزت الحد الأقصى للضيوف في باقتك"), { code: "GUEST_LIMIT" });
    }
  }
  const updatedAt = new Date().toISOString();
  if (normalized.length) await db.insert(guests).values(normalized.map((row) => ({ eventId, inviteToken: createInviteToken(), name: row.name, phone: row.phone, partySize: row.partySize, updatedAt }))).onConflictDoUpdate({
    target: [guests.eventId, guests.name],
    set: { phone: sql`excluded.phone`, partySize: sql`excluded.party_size`, updatedAt: sql`excluded.updated_at` },
  });
  const importedGuests = normalized.length ? await db.select({ id: guests.id, name: guests.name }).from(guests).where(and(eq(guests.eventId, eventId), inArray(guests.name, normalized.map((row) => row.name)))) : [];
  const importedGuestIds = importedGuests.map((guest) => guest.id);
  if (importedGuestIds.length) await db.delete(guestGroupMemberships).where(inArray(guestGroupMemberships.guestId, importedGuestIds));
  const groupMembershipRows = importedGuests.flatMap((guest) => {
    const row = normalized.find((item) => item.name === guest.name);
    return row?.groupId ? [{ guestId: guest.id, groupId: row.groupId }] : [];
  });
  if (groupMembershipRows.length) await db.insert(guestGroupMemberships).values(groupMembershipRows);
  const imported = normalized.length;
  await db.insert(activityLogs).values({ eventId, actor: ownerEmail, action: "guests_imported", details: { imported, received: rows.length, duplicates: validRows.length - normalized.length } });
  const overview = await overviewForEvent(eventId);
  return overview ? { ...overview, importSummary: { imported, skipped: rows.length - imported } } : null;
}

export async function addGuest(ownerEmail: string, eventId: string, input: { name: string; phone?: string; status?: "yes" | "maybe" | "pending" | "no"; partySize?: number; meal?: string }) {
  const db = getDb();
  const ownerId = await ensureOwner(ownerEmail);
  const [event] = await db.select().from(events).where(and(eq(events.id, eventId), eq(events.ownerId, ownerId))).limit(1);
  if (!event) return null;
  const limit = await getGuestLimitForOwnerEmail(ownerEmail);
  if (limit !== null) {
    const [row] = await db.select({ value: count() }).from(guests).where(eq(guests.eventId, eventId));
    if (Number(row.value) + 1 > limit) {
      throw Object.assign(new Error("تجاوزت الحد الأقصى للضيوف في باقتك"), { code: "GUEST_LIMIT" });
    }
  }
  const now = new Date().toISOString();
  await db.insert(guests).values({ eventId, inviteToken: createInviteToken(), name: input.name.trim(), phone: input.phone?.trim() || "", status: input.status ?? "pending", partySize: Math.max(1, Math.min(10, input.partySize ?? 1)), meal: input.meal?.trim() || "—", respondedAt: input.status && input.status !== "pending" ? now : null, updatedAt: now }).onConflictDoUpdate({
    target: [guests.eventId, guests.name],
    set: { phone: input.phone?.trim() || "", status: input.status ?? "pending", partySize: Math.max(1, Math.min(10, input.partySize ?? 1)), meal: input.meal?.trim() || "—", respondedAt: input.status && input.status !== "pending" ? now : null, updatedAt: now },
  });
  await db.insert(activityLogs).values({ eventId, actor: ownerEmail, action: "guest_added", details: { name: input.name } });
  return overviewForEvent(eventId);
}

export async function updateGuest(ownerEmail: string, eventId: string, guestId: string, input: { name?: string; phone?: string; status?: "yes" | "maybe" | "pending" | "no"; partySize?: number; meal?: string }) {
  const db = getDb();
  const ownerId = await ensureOwner(ownerEmail);
  const [event] = await db.select().from(events).where(and(eq(events.id, eventId), eq(events.ownerId, ownerId))).limit(1);
  if (!event) return null;
  const patch: Partial<typeof guests.$inferInsert> = { updatedAt: new Date().toISOString() };
  if (input.name?.trim()) patch.name = input.name.trim();
  if (input.phone !== undefined) patch.phone = input.phone.trim();
  if (input.status) patch.status = input.status;
  if (input.status) patch.respondedAt = input.status === "pending" ? null : new Date().toISOString();
  if (input.partySize !== undefined) patch.partySize = Math.max(1, Math.min(10, input.partySize));
  if (input.meal !== undefined) patch.meal = input.meal.trim() || "—";
  await db.update(guests).set(patch).where(and(eq(guests.id, guestId), eq(guests.eventId, eventId)));
  await db.insert(activityLogs).values({ eventId, actor: ownerEmail, action: "guest_updated", details: { guestId, ...input } });
  return overviewForEvent(eventId);
}

export async function deleteGuest(ownerEmail: string, eventId: string, guestId: string) {
  const db = getDb();
  const ownerId = await ensureOwner(ownerEmail);
  const [event] = await db.select().from(events).where(and(eq(events.id, eventId), eq(events.ownerId, ownerId))).limit(1);
  if (!event) return null;
  await db.delete(guests).where(and(eq(guests.id, guestId), eq(guests.eventId, eventId)));
  await db.insert(activityLogs).values({ eventId, actor: ownerEmail, action: "guest_deleted", details: { guestId } });
  return overviewForEvent(eventId);
}

export async function getInvitationBySlug(slug: string, inviteToken?: string) {
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event || event.status !== "published") return null;
  const [invitation] = await db.select().from(invitations).where(eq(invitations.eventId, event.id)).limit(1);
  if (!invitation) return null;
  const allSegments = await db.select().from(eventSegments).where(eq(eventSegments.eventId, event.id)).orderBy(asc(eventSegments.position), asc(eventSegments.startsAt));
  if (!inviteToken) return { event, invitation, guest: null, segments: allSegments, segmentRsvps: [] };
  const [guest] = await db.select().from(guests).where(and(eq(guests.eventId, event.id), eq(guests.inviteToken, inviteToken))).limit(1);
  if (!guest) return { event, invitation, guest: null, segments: allSegments, segmentRsvps: [] };
  const [membership] = await db.select().from(guestGroupMemberships).where(eq(guestGroupMemberships.guestId, guest.id)).limit(1);
  const directRules = await db.select().from(guestSegmentAccess).where(eq(guestSegmentAccess.guestId, guest.id));
  const groupRules = membership ? await db.select().from(guestSegmentAccess).where(eq(guestSegmentAccess.groupId, membership.groupId)) : [];
  const effectiveRules = directRules.length ? directRules : groupRules;
  const allowedIds = new Set(effectiveRules.filter((rule) => rule.invited).map((rule) => rule.segmentId));
  const visibleSegments = effectiveRules.length ? allSegments.filter((segment) => allowedIds.has(segment.id)) : allSegments;
  const rsvpRows = await db.select().from(segmentRsvps).where(eq(segmentRsvps.guestId, guest.id));
  return { event, invitation, guest, segments: visibleSegments, segmentRsvps: rsvpRows };
}

export async function trackInvitationOpen(eventId: string, inviteToken: string) {
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event || event.status !== "published") throw new Error("الدعوة غير متاحة");
  const [guest] = await db.select().from(guests).where(and(eq(guests.eventId, eventId), eq(guests.inviteToken, inviteToken))).limit(1);
  if (!guest) throw new Error("رابط الدعوة الشخصي غير صالح");
  if (!guest.openedAt) {
    const openedAt = new Date().toISOString();
    await db.update(guests).set({ openedAt, updatedAt: openedAt }).where(eq(guests.id, guest.id));
  }
}

export async function saveRsvp(input: {
  eventId: string;
  name: string;
  status: "yes" | "maybe" | "no";
  partySize: number;
  meal: string;
  message?: string;
  inviteToken?: string;
  segmentResponses?: Array<{ segmentId: string; status: "yes" | "maybe" | "no"; partySize: number }>;
}) {
  if (!input.eventId?.trim()) throw new Error("المناسبة مطلوبة");
  const db = getDb();
  const eventId = input.eventId;
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  const [invitation] = await db.select().from(invitations).where(eq(invitations.eventId, eventId)).limit(1);
  if (!event || event.status !== "published" || !invitation?.rsvpEnabled) throw new Error("تأكيد الحضور غير متاح لهذه الدعوة");
  if (invitation.rsvpDeadline) {
    const deadline = new Date(`${invitation.rsvpDeadline}T23:59:59+03:00`);
    if (!Number.isNaN(deadline.getTime()) && Date.now() > deadline.getTime()) throw new Error("انتهى موعد تأكيد الحضور");
  }
  const partySize = input.status === "yes" ? Math.min(invitation.maxPartySize, Math.max(1, input.partySize)) : 1;
  const updatedAt = new Date().toISOString();
  const personalizedGuest = input.inviteToken
    ? (await db.select().from(guests).where(and(eq(guests.eventId, eventId), eq(guests.inviteToken, input.inviteToken))).limit(1))[0]
    : null;
  if (input.inviteToken && !personalizedGuest) throw new Error("رابط الدعوة الشخصي غير صالح");
  const eventSegmentRows = await db.select({ id: eventSegments.id }).from(eventSegments).where(eq(eventSegments.eventId, eventId));
  const validSegmentIds = new Set(eventSegmentRows.map((segment) => segment.id));
  const responses = (input.segmentResponses ?? []).filter((response) => validSegmentIds.has(response.segmentId));
  if (input.segmentResponses && responses.length !== input.segmentResponses.length) throw new Error("إحدى مراحل المناسبة غير صالحة");
  let effectiveRules: Array<typeof guestSegmentAccess.$inferSelect> = [];
  if (personalizedGuest) {
    const directRules = await db.select().from(guestSegmentAccess).where(eq(guestSegmentAccess.guestId, personalizedGuest.id));
    const [membership] = await db.select().from(guestGroupMemberships).where(eq(guestGroupMemberships.guestId, personalizedGuest.id)).limit(1);
    const groupRules = membership ? await db.select().from(guestSegmentAccess).where(eq(guestSegmentAccess.groupId, membership.groupId)) : [];
    effectiveRules = directRules.length ? directRules : groupRules;
    if (effectiveRules.length && responses.some((response) => !effectiveRules.some((rule) => rule.segmentId === response.segmentId && rule.invited))) throw new Error("لا تملك هذه الدعوة صلاحية الرد على إحدى المراحل");
  }
  let savedGuest = personalizedGuest;
  if (personalizedGuest) {
    await db.update(guests).set({
      status: input.status,
      partySize,
      meal: input.status === "yes" && invitation.mealQuestionEnabled ? input.meal : "—",
      message: input.message ?? "",
      openedAt: personalizedGuest.openedAt ?? updatedAt,
      respondedAt: updatedAt,
      updatedAt,
    }).where(eq(guests.id, personalizedGuest.id));
    await db.insert(activityLogs).values({ eventId, actor: personalizedGuest.name, action: "rsvp_submitted", details: { status: input.status, partySize, personalized: true } });
    savedGuest = (await db.select().from(guests).where(eq(guests.id, personalizedGuest.id)).limit(1))[0];
  } else {
    const id = crypto.randomUUID();
    await db.insert(guests).values({ id, eventId, inviteToken: createInviteToken(), name: input.name, status: input.status, partySize, meal: input.status === "yes" && invitation.mealQuestionEnabled ? input.meal : "—", message: input.message ?? "", openedAt: updatedAt, respondedAt: updatedAt, updatedAt }).onConflictDoUpdate({
      target: [guests.eventId, guests.name],
      set: { status: input.status, partySize, meal: input.status === "yes" && invitation.mealQuestionEnabled ? input.meal : "—", message: input.message ?? "", openedAt: updatedAt, respondedAt: updatedAt, updatedAt },
    });
    await db.insert(activityLogs).values({ eventId, actor: input.name, action: "rsvp_submitted", details: { status: input.status, partySize } });
    savedGuest = (await db.select().from(guests).where(and(eq(guests.eventId, eventId), eq(guests.name, input.name))).limit(1))[0];
  }
  if (!savedGuest) throw new Error("تعذر حفظ بيانات الضيف");
  for (const response of responses) {
    const accessLimit = effectiveRules.find((rule) => rule.segmentId === response.segmentId)?.partyLimit ?? invitation.maxPartySize;
    const responsePartySize = response.status === "yes" ? Math.min(invitation.maxPartySize, accessLimit, Math.max(1, response.partySize)) : 1;
    await db.insert(segmentRsvps).values({
      guestId: savedGuest.id,
      segmentId: response.segmentId,
      status: response.status,
      partySize: responsePartySize,
      respondedAt: updatedAt,
      updatedAt,
    }).onConflictDoUpdate({
      target: [segmentRsvps.guestId, segmentRsvps.segmentId],
      set: { status: response.status, partySize: responsePartySize, respondedAt: updatedAt, updatedAt },
    });
  }
  return savedGuest;
}

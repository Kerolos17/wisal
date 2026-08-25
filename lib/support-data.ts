import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { adminAuditLogs, events, supportTickets, userNotifications, users } from "@/db/schema";

const categories = ["account", "invitation", "guests", "technical", "billing", "other"] as const;
const priorities = ["normal", "high", "urgent"] as const;
const statuses = ["open", "in_progress", "resolved", "closed"] as const;

async function accountByEmail(email: string) {
  const [account] = await getDb().select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (!account) throw new Error("Account unavailable");
  return account;
}

export async function listNotifications(email: string) {
  const account = await accountByEmail(email);
  return getDb().select().from(userNotifications).where(eq(userNotifications.userId, account.id)).orderBy(desc(userNotifications.createdAt)).limit(50);
}

export async function markNotificationsRead(email: string) {
  const account = await accountByEmail(email);
  await getDb().update(userNotifications).set({ readAt: new Date().toISOString() }).where(and(eq(userNotifications.userId, account.id), isNull(userNotifications.readAt)));
  return listNotifications(email);
}

export async function listMySupportTickets(email: string) {
  const account = await accountByEmail(email);
  return getDb().select().from(supportTickets).where(eq(supportTickets.userId, account.id)).orderBy(desc(supportTickets.createdAt)).limit(50);
}

export async function createSupportTicket(email: string, payload: { subject?: string; message?: string; category?: string; priority?: string; eventId?: string | null }) {
  const subject = payload.subject?.trim() ?? "";
  const message = payload.message?.trim() ?? "";
  if (subject.length < 4 || subject.length > 140 || message.length < 10 || message.length > 4000) throw new Error("Invalid support ticket");
  if (!categories.includes(payload.category as typeof categories[number]) || !priorities.includes(payload.priority as typeof priorities[number])) throw new Error("Invalid support ticket options");
  const db = getDb();
  const account = await accountByEmail(email);
  if (payload.eventId) {
    const [ownedEvent] = await db.select({ id: events.id }).from(events).where(and(eq(events.id, payload.eventId), eq(events.ownerId, account.id))).limit(1);
    if (!ownedEvent) throw new Error("Event unavailable");
  }
  const [ticket] = await db.insert(supportTickets).values({ userId: account.id, eventId: payload.eventId || null, subject, message, category: payload.category as typeof categories[number], priority: payload.priority as typeof priorities[number] }).returning();
  await db.insert(userNotifications).values({ userId: account.id, kind: "support", titleAr: "استلمنا طلب الدعم", titleEn: "Support request received", bodyAr: `تم إنشاء التذكرة «${subject}» وسنحدث حالتها هنا.`, bodyEn: `Your “${subject}” ticket was created. We will update its status here.`, actionHref: "/workspace?section=support" });
  return ticket;
}

export async function updateSupportTicket(actorEmail: string, id: string, payload: { status?: string; priority?: string; resolution?: string }) {
  if (!statuses.includes(payload.status as typeof statuses[number]) || !priorities.includes(payload.priority as typeof priorities[number])) throw new Error("Invalid ticket update");
  const db = getDb();
  const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
  if (!ticket) return null;
  const [updated] = await db.update(supportTickets).set({ status: payload.status as typeof statuses[number], priority: payload.priority as typeof priorities[number], resolution: payload.resolution?.trim().slice(0, 4000) ?? "", updatedAt: new Date().toISOString() }).where(eq(supportTickets.id, id)).returning();
  await db.insert(userNotifications).values({ userId: ticket.userId, kind: updated.status === "resolved" ? "success" : "support", titleAr: "تحديث على طلب الدعم", titleEn: "Support request updated", bodyAr: updated.status === "resolved" ? `تم حل التذكرة «${updated.subject}».` : `تم تحديث حالة التذكرة «${updated.subject}».`, bodyEn: updated.status === "resolved" ? `Your “${updated.subject}” ticket was resolved.` : `Your “${updated.subject}” ticket status was updated.`, actionHref: "/workspace?section=support" });
  const [actor] = await db.select({ id: users.id }).from(users).where(eq(users.email, actorEmail.toLowerCase())).limit(1);
  await db.insert(adminAuditLogs).values({ actorUserId: actor?.id ?? null, action: "support_ticket.updated", resourceType: "support_ticket", resourceId: id, metadata: { status: updated.status, priority: updated.priority } });
  return updated;
}

export async function listAdminSupportTickets() {
  return getDb().select({ id: supportTickets.id, subject: supportTickets.subject, message: supportTickets.message, category: supportTickets.category, priority: supportTickets.priority, status: supportTickets.status, resolution: supportTickets.resolution, createdAt: supportTickets.createdAt, updatedAt: supportTickets.updatedAt, userName: users.displayName, userEmail: users.email, eventTitle: events.title }).from(supportTickets).leftJoin(users, eq(supportTickets.userId, users.id)).leftJoin(events, eq(supportTickets.eventId, events.id)).orderBy(desc(supportTickets.updatedAt)).limit(100);
}

export async function countOpenSupportTickets() {
  const rows = await getDb().select({ id: supportTickets.id }).from(supportTickets).where(inArray(supportTickets.status, ["open", "in_progress"]));
  return rows.length;
}

import { asc, count, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { adminAuditLogs, events, guests, invitations, paymentRequests, platformContent, platformPlans, platformTemplates, users } from "@/db/schema";
import { countOpenSupportTickets, listAdminSupportTickets } from "@/lib/support-data";
import { getPlatformOwnerEmail, isPlatformOwner } from "@/lib/platform-owner";

const allowedRoles = ["admin", "support", "content_manager", "couple"] as const;
export type PlatformRole = typeof allowedRoles[number];

const templateSeed = [
  { code: "love-poem", nameAr: "أناقة التحرير", nameEn: "Élan Editorial", category: "classic" },
  { code: "garden-night", nameAr: "حُلم الحديقة", nameEn: "Garden Reverie", category: "botanical" },
  { code: "moonlight", nameAr: "قمر زجاجي", nameEn: "Glass Moon", category: "modern" },
  { code: "golden-vows", nameAr: "الوعد المُذهّب", nameEn: "Gilded Promise", category: "luxury" },
  { code: "white-story", nameAr: "سُكون", nameEn: "Still", category: "minimal" },
  { code: "cinema-night", nameAr: "بعد الغروب", nameEn: "After Dark", category: "cinematic" },
  { code: "rose-garden", nameAr: "وردة حالمة", nameEn: "Blush Botanica", category: "botanical" },
  { code: "cathedral-light", nameAr: "الميثاق الملكي", nameEn: "The Royal Chapel", category: "classic" },
  { code: "desert-sunset", nameAr: "صفحات الغروب", nameEn: "Sunlit Pages", category: "modern" },
  { code: "velvet-night", nameAr: "العرض المخملي", nameEn: "Velvet Première", category: "luxury" },
  { code: "coastal-breeze", nameAr: "عهود الساحل", nameEn: "Barefoot Vows", category: "minimal" },
  { code: "modern-monogram", nameAr: "حروف النور", nameEn: "Noor Monogram", category: "cinematic" },
];

const planSeed = [
  { code: "starter", nameAr: "البداية", nameEn: "Starter", priceEgp: 0, guestLimit: 50, position: 1, featuresAr: ["دعوة واحدة", "50 ضيفًا"], featuresEn: ["One invitation", "50 guests"] },
  { code: "elegant", nameAr: "الأنيقة", nameEn: "Elegant", priceEgp: 899, guestLimit: 250, position: 2, featured: true, featuresAr: ["قوالب مميزة", "250 ضيفًا", "تقارير الحضور"], featuresEn: ["Premium templates", "250 guests", "RSVP reports"] },
  { code: "signature", nameAr: "التوقيع", nameEn: "Signature", priceEgp: 1699, guestLimit: null, position: 3, featuresAr: ["ضيوف بلا حد", "تجربة سينمائية", "دعم أولوية"], featuresEn: ["Unlimited guests", "Cinematic experience", "Priority support"] },
];

const contentSeed = [
  { key: "hero_eyebrow", groupName: "landing", valueAr: "دعوتكما، كما تستحق الحكاية", valueEn: "Your invitation, worthy of your story" },
  { key: "hero_description", groupName: "landing", valueAr: "صمّما دعوة رقمية راقية، أديرا الضيوف والمواقع، وتابعا الردود بسهولة.", valueEn: "Create an elegant digital invitation, manage guests and venues, and track every RSVP." },
  { key: "hero_primary_cta", groupName: "landing", valueAr: "ابدآ تصميم الدعوة", valueEn: "Start designing" },
  { key: "support_email", groupName: "support", valueAr: "support@wisal.app", valueEn: "support@wisal.app" },
];

async function ensurePlatformData() {
  const db = getDb();
  const ownerEmail = getPlatformOwnerEmail();
  await Promise.all([
    db.insert(platformTemplates).values(templateSeed).onConflictDoNothing({ target: platformTemplates.code }),
    db.insert(platformPlans).values(planSeed).onConflictDoNothing({ target: platformPlans.code }),
    db.insert(platformContent).values(contentSeed).onConflictDoNothing({ target: platformContent.key }),
  ]);
  await db.update(users).set({ role: "admin", updatedAt: new Date().toISOString() }).where(eq(users.email, ownerEmail));
}

async function ownerId() {
  const db = getDb();
  const ownerEmail = getPlatformOwnerEmail();
  const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.email, ownerEmail)).limit(1);
  return owner?.id ?? null;
}

async function audit(action: string, resourceType: string, resourceId: string, metadata: Record<string, unknown> = {}) {
  const db = getDb();
  await db.insert(adminAuditLogs).values({ actorUserId: await ownerId(), action, resourceType, resourceId, metadata });
}

export async function getAdminOverview() {
  const db = getDb();
  await ensurePlatformData();
  const [userCount] = await db.select({ value: count() }).from(users);
  const [eventCount] = await db.select({ value: count() }).from(events);
  const [publishedCount] = await db.select({ value: count() }).from(events).where(eq(events.status, "published"));
  const [guestCount] = await db.select({ value: count() }).from(guests);
  const [openCount] = await db.select({ value: count() }).from(guests).where(sql`${guests.openedAt} is not null`);
  const [responseCount] = await db.select({ value: count() }).from(guests).where(sql`${guests.respondedAt} is not null`);
  const [pendingPayments] = await db.select({ value: count() }).from(paymentRequests).where(eq(paymentRequests.status, "pending_review"));
  const userRows = (await db.select({ id: users.id, email: users.email, displayName: users.displayName, role: users.role, locale: users.locale, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt)).limit(100)).map((row) => ({ ...row, roleLocked: isPlatformOwner(row.email) }));
  const eventRows = await db.select({ id: events.id, title: events.title, slug: events.slug, status: events.status, eventDate: events.eventDate, city: events.city, ownerName: users.displayName, template: invitations.template, updatedAt: events.updatedAt }).from(events).leftJoin(users, eq(events.ownerId, users.id)).leftJoin(invitations, eq(invitations.eventId, events.id)).orderBy(desc(events.updatedAt)).limit(100);
  const [templateRows, planRows, contentRows, auditRows, supportRows, openSupport] = await Promise.all([
    db.select().from(platformTemplates).orderBy(asc(platformTemplates.createdAt)),
    db.select().from(platformPlans).orderBy(asc(platformPlans.position)),
    db.select().from(platformContent).orderBy(asc(platformContent.groupName), asc(platformContent.key)),
    db.select({ id: adminAuditLogs.id, action: adminAuditLogs.action, resourceType: adminAuditLogs.resourceType, resourceId: adminAuditLogs.resourceId, metadata: adminAuditLogs.metadata, createdAt: adminAuditLogs.createdAt, actorName: users.displayName }).from(adminAuditLogs).leftJoin(users, eq(adminAuditLogs.actorUserId, users.id)).orderBy(desc(adminAuditLogs.createdAt)).limit(100),
    listAdminSupportTickets(),
    countOpenSupportTickets(),
  ]);
  return { stats: { users: Number(userCount.value), events: Number(eventCount.value), published: Number(publishedCount.value), guests: Number(guestCount.value), opened: Number(openCount.value), responded: Number(responseCount.value), supportOpen: openSupport, paymentsPending: Number(pendingPayments.value) }, users: userRows, events: eventRows, templates: templateRows, plans: planRows, content: contentRows, audit: auditRows, support: supportRows };
}

export async function updatePlatformTemplate(code: string, active: boolean) {
  const db = getDb(); await ensurePlatformData();
  const [updated] = await db.update(platformTemplates).set({ active, updatedAt: new Date().toISOString() }).where(eq(platformTemplates.code, code)).returning();
  if (updated) await audit("template.updated", "template", code, { active });
  return updated ?? null;
}

export async function updateUserRole(id: string, role: string) {
  if (!allowedRoles.includes(role as PlatformRole)) throw new Error("Invalid role");
  const db = getDb();
  const [target] = await db.select({ email: users.email }).from(users).where(eq(users.id, id)).limit(1);
  if (!target) return null;
  if (isPlatformOwner(target.email) && role !== "admin") throw new Error("The platform owner must remain an admin");
  const [updated] = await db.update(users).set({ role, updatedAt: new Date().toISOString() }).where(eq(users.id, id)).returning();
  if (updated) await audit("user.role_updated", "user", id, { role });
  return updated ?? null;
}

export async function updatePlatformPlan(code: string, changes: { priceEgp?: number; active?: boolean; featured?: boolean }) {
  const db = getDb(); await ensurePlatformData();
  const update = { ...changes, updatedAt: new Date().toISOString() };
  const [updated] = await db.update(platformPlans).set(update).where(eq(platformPlans.code, code)).returning();
  if (updated) await audit("plan.updated", "plan", code, changes);
  return updated ?? null;
}

export async function updatePlatformContent(key: string, valueAr: string, valueEn: string) {
  const db = getDb(); await ensurePlatformData();
  const [updated] = await db.update(platformContent).set({ valueAr, valueEn, updatedAt: new Date().toISOString() }).where(eq(platformContent.key, key)).returning();
  if (updated) await audit("content.updated", "content", key, { languages: ["ar", "en"] });
  return updated ?? null;
}

export async function getPublicPlatformConfig() {
  const db = getDb(); await ensurePlatformData();
  const [content, plans, templates] = await Promise.all([
    db.select({ key: platformContent.key, valueAr: platformContent.valueAr, valueEn: platformContent.valueEn }).from(platformContent),
    db.select({ code: platformPlans.code, nameAr: platformPlans.nameAr, nameEn: platformPlans.nameEn, priceEgp: platformPlans.priceEgp, guestLimit: platformPlans.guestLimit, featured: platformPlans.featured, featuresAr: platformPlans.featuresAr, featuresEn: platformPlans.featuresEn }).from(platformPlans).where(eq(platformPlans.active, true)).orderBy(asc(platformPlans.position)),
    db.select({ code: platformTemplates.code, nameAr: platformTemplates.nameAr, nameEn: platformTemplates.nameEn, category: platformTemplates.category }).from(platformTemplates).where(eq(platformTemplates.active, true)).orderBy(asc(platformTemplates.createdAt)),
  ]);
  return { content, plans, templates };
}

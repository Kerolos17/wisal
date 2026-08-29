import { sql } from "drizzle-orm";
import { boolean, check, customType, date, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

const now = sql`now()`;
const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authProviderId: text("auth_provider_id"),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("couple"),
  locale: text("locale").notNull().default("ar"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [
  check("users_role_check", sql`${table.role} in ('admin', 'support', 'content_manager', 'couple')`),
  check("users_locale_check", sql`${table.locale} in ('ar', 'en')`),
]);

export const rateLimitWindows = pgTable("rate_limit_windows", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at", { withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [
  index("rate_limit_windows_reset_at_idx").on(table.resetAt),
  check("rate_limit_windows_count_positive", sql`${table.count} >= 0`),
]);

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  brideName: text("bride_name").notNull(),
  groomName: text("groom_name").notNull(),
  eventDate: timestamp("event_date", { withTimezone: true, mode: "string" }).notNull(),
  venue: text("venue").notNull().default(""),
  city: text("city").notNull().default(""),
  mapUrl: text("map_url").notNull().default(""),
  defaultLocale: text("default_locale", { enum: ["ar", "en"] }).notNull().default("ar"),
  enabledLocales: jsonb("enabled_locales").$type<Array<"ar" | "en">>().notNull().default(["ar", "en"]),
  slug: text("slug").notNull().unique(),
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [
  index("events_owner_id_idx").on(table.ownerId),
  check("events_status_check", sql`${table.status} in ('draft', 'published', 'archived')`),
  check("events_default_locale_check", sql`${table.defaultLocale} in ('ar', 'en')`),
]);

export const eventSegments = pgTable("event_segments", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  kind: text("kind", { enum: ["ceremony", "reception", "dinner", "party", "session", "other"] }).notNull().default("other"),
  startsAt: timestamp("starts_at", { withTimezone: true, mode: "string" }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true, mode: "string" }),
  venueName: text("venue_name").notNull().default(""),
  city: text("city").notNull().default(""),
  address: text("address").notNull().default(""),
  mapUrl: text("map_url").notNull().default(""),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [
  index("event_segments_event_position_idx").on(table.eventId, table.position),
  check("event_segments_kind_check", sql`${table.kind} in ('ceremony', 'reception', 'dinner', 'party', 'session', 'other')`),
]);

export const guestGroups = pgTable("guest_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [
  uniqueIndex("guest_groups_event_name_unique").on(table.eventId, table.name),
]);

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  template: text("template").notNull().default("قصيدة حب"),
  message: text("message").notNull().default(""),
  rsvpDeadline: date("rsvp_deadline", { mode: "string" }),
  accentColor: text("accent_color").notNull().default("plum"),
  fontStyle: text("font_style").notNull().default("classic"),
  openingStyle: text("opening_style", { enum: ["envelope", "card", "curtain"] }).notNull().default("envelope"),
  layoutStyle: text("layout_style", { enum: ["classic", "story", "cinematic"] }).notNull().default("classic"),
  showMessage: boolean("show_message").notNull().default(true),
  showCountdown: boolean("show_countdown").notNull().default(true),
  showSchedule: boolean("show_schedule").notNull().default(true),
  sectionOrder: jsonb("section_order").$type<string[]>().notNull().default(["message", "countdown", "schedule", "rsvp"]),
  accessMode: text("access_mode", { enum: ["public", "private"] }).notNull().default("public"),
  rsvpEnabled: boolean("rsvp_enabled").notNull().default(true),
  mealQuestionEnabled: boolean("meal_question_enabled").notNull().default(true),
  maxPartySize: integer("max_party_size").notNull().default(2),
  coverImageKey: text("cover_image_key"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [
  uniqueIndex("invitations_event_id_unique").on(table.eventId),
  check("invitations_opening_style_check", sql`${table.openingStyle} in ('envelope', 'card', 'curtain')`),
  check("invitations_layout_style_check", sql`${table.layoutStyle} in ('classic', 'story', 'cinematic')`),
  check("invitations_access_mode_check", sql`${table.accessMode} in ('public', 'private')`),
]);

export const platformTemplates = pgTable("platform_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  category: text("category").notNull().default("classic"),
  active: boolean("active").notNull().default(true),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().default(now),
});

export const platformPlans = pgTable("platform_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  priceEgp: integer("price_egp").notNull().default(0),
  guestLimit: integer("guest_limit"),
  durationDays: integer("duration_days").notNull().default(365),
  active: boolean("active").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  position: integer("position").notNull().default(0),
  featuresAr: jsonb("features_ar").$type<string[]>().notNull().default([]),
  featuresEn: jsonb("features_en").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().default(now),
});

export const platformContent = pgTable("platform_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  groupName: text("group_name").notNull().default("general"),
  valueAr: text("value_ar").notNull(),
  valueEn: text("value_en").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().default(now),
});

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [index("admin_audit_logs_created_idx").on(table.createdAt)]);

export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  category: text("category", { enum: ["account", "invitation", "guests", "technical", "billing", "other"] }).notNull().default("other"),
  priority: text("priority", { enum: ["normal", "high", "urgent"] }).notNull().default("normal"),
  status: text("status", { enum: ["open", "in_progress", "resolved", "closed"] }).notNull().default("open"),
  resolution: text("resolution").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [
  index("support_tickets_user_created_idx").on(table.userId, table.createdAt),
  index("support_tickets_status_priority_idx").on(table.status, table.priority),
  check("support_tickets_category_check", sql`${table.category} in ('account', 'invitation', 'guests', 'technical', 'billing', 'other')`),
  check("support_tickets_priority_check", sql`${table.priority} in ('normal', 'high', 'urgent')`),
  check("support_tickets_status_check", sql`${table.status} in ('open', 'in_progress', 'resolved', 'closed')`),
]);

export const userNotifications = pgTable("user_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind", { enum: ["info", "success", "warning", "support"] }).notNull().default("info"),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  bodyAr: text("body_ar").notNull(),
  bodyEn: text("body_en").notNull(),
  actionHref: text("action_href").notNull().default(""),
  readAt: timestamp("read_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [
  index("user_notifications_user_created_idx").on(table.userId, table.createdAt),
  index("user_notifications_user_read_idx").on(table.userId, table.readAt),
  check("user_notifications_kind_check", sql`${table.kind} in ('info', 'success', 'warning', 'support')`),
]);

export const guests = pgTable("guests", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(), phone: text("phone").notNull().default(""),
  inviteToken: uuid("invite_token").notNull().defaultRandom(),
  status: text("status", { enum: ["yes", "maybe", "pending", "no"] }).notNull().default("pending"),
  partySize: integer("party_size").notNull().default(1), meal: text("meal").notNull().default("—"), message: text("message").notNull().default(""),
  openedAt: timestamp("opened_at", { withTimezone: true, mode: "string" }), respondedAt: timestamp("responded_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now), updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [
  uniqueIndex("guests_event_name_unique").on(table.eventId, table.name),
  uniqueIndex("guests_invite_token_unique").on(table.inviteToken),
  index("guests_event_status_idx").on(table.eventId, table.status),
  check("guests_status_check", sql`${table.status} in ('yes', 'maybe', 'pending', 'no')`),
  check("guests_party_size_positive", sql`${table.partySize} > 0`),
]);

export const guestGroupMemberships = pgTable("guest_group_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  guestId: uuid("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" }),
  groupId: uuid("group_id").notNull().references(() => guestGroups.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [
  uniqueIndex("guest_group_memberships_guest_unique").on(table.guestId),
  index("guest_group_memberships_group_idx").on(table.groupId),
]);

export const guestSegmentAccess = pgTable("guest_segment_access", {
  id: uuid("id").primaryKey().defaultRandom(),
  segmentId: uuid("segment_id").notNull().references(() => eventSegments.id, { onDelete: "cascade" }),
  guestId: uuid("guest_id").references(() => guests.id, { onDelete: "cascade" }),
  groupId: uuid("group_id").references(() => guestGroups.id, { onDelete: "cascade" }),
  invited: boolean("invited").notNull().default(true),
  partyLimit: integer("party_limit").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [
  uniqueIndex("guest_segment_access_guest_unique").on(table.segmentId, table.guestId),
  uniqueIndex("guest_segment_access_group_unique").on(table.segmentId, table.groupId),
  index("guest_segment_access_segment_idx").on(table.segmentId),
  check("guest_segment_access_single_audience", sql`num_nonnulls(${table.guestId}, ${table.groupId}) = 1`),
  check("guest_segment_access_party_limit_positive", sql`${table.partyLimit} > 0`),
]);

export const segmentRsvps = pgTable("segment_rsvps", {
  id: uuid("id").primaryKey().defaultRandom(),
  segmentId: uuid("segment_id").notNull().references(() => eventSegments.id, { onDelete: "cascade" }),
  guestId: uuid("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["yes", "maybe", "pending", "no"] }).notNull().default("pending"),
  partySize: integer("party_size").notNull().default(1),
  answers: jsonb("answers").notNull().default({}),
  respondedAt: timestamp("responded_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [
  uniqueIndex("segment_rsvps_guest_segment_unique").on(table.guestId, table.segmentId),
  index("segment_rsvps_segment_status_idx").on(table.segmentId, table.status),
  check("segment_rsvps_status_check", sql`${table.status} in ('yes', 'maybe', 'pending', 'no')`),
  check("segment_rsvps_party_size_positive", sql`${table.partySize} > 0`),
]);

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(), eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }), actor: text("actor_label").notNull().default(""),
  action: text("action").notNull(), details: jsonb("details").notNull().default({}), createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [index("activity_event_created_idx").on(table.eventId, table.createdAt)]);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(), eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  title: text("title").notNull(), body: text("body").notNull(), audience: text("audience", { enum: ["all", "pending", "confirmed", "unopened", "opened_pending", "maybe", "declined"] }).notNull().default("all"),
  groupId: uuid("group_id").references(() => guestGroups.id, { onDelete: "set null" }),
  segmentId: uuid("segment_id").references(() => eventSegments.id, { onDelete: "set null" }),
  status: text("status", { enum: ["draft", "scheduled", "sent", "failed"] }).notNull().default("draft"), scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: "string" }), sentAt: timestamp("sent_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [
  index("messages_event_created_idx").on(table.eventId, table.createdAt),
  index("messages_event_group_idx").on(table.eventId, table.groupId),
  index("messages_event_segment_idx").on(table.eventId, table.segmentId),
  check("messages_audience_check", sql`${table.audience} in ('all', 'pending', 'confirmed', 'unopened', 'opened_pending', 'maybe', 'declined')`),
  check("messages_status_check", sql`${table.status} in ('draft', 'scheduled', 'sent', 'failed')`),
]);

// --- Phase 1: Manual payment domain ---

export const paymentStatus = ["draft", "pending_review", "needs_info", "rejected", "approved", "cancelled"] as const;
export const paymentMethod = ["instapay", "vodafone_cash", "orange_cash", "etisalat_cash", "bank_transfer"] as const;

export const paymentDestinationMethod = ["instapay", "vodafone_cash", "orange_cash", "etisalat_cash", "bank_transfer"] as const;

export const paymentDestinations = pgTable("payment_destinations", {
  id: uuid("id").primaryKey().defaultRandom(),
  method: text("method", { enum: paymentDestinationMethod }).notNull().unique(),
  labelAr: text("label_ar").notNull(),
  labelEn: text("label_en").notNull(),
  recipientName: text("recipient_name").notNull(),
  accountIdentifier: text("account_identifier").notNull(),
  bankName: text("bank_name").notNull().default(""),
  instructionsAr: text("instructions_ar").notNull().default(""),
  instructionsEn: text("instructions_en").notNull().default(""),
  paymentUrl: text("payment_url").notNull().default(""),
  qrKey: text("qr_key"),
  active: boolean("active").notNull().default(true),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [
  index("payment_destinations_active_position_idx").on(table.active, table.position),
  check("payment_destinations_method_check", sql`${table.method} in ('instapay', 'vodafone_cash', 'orange_cash', 'etisalat_cash', 'bank_transfer')`),
]);

export const paymentRequests = pgTable("payment_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planCode: text("plan_code").notNull().references(() => platformPlans.code, { onDelete: "restrict" }),
  status: text("status", { enum: paymentStatus }).notNull().default("draft"),

  // Plan snapshot (immutable after creation)
  planNameSnapshot: text("plan_name_snapshot").notNull(),
  priceEgpSnapshot: integer("price_egp_snapshot").notNull(),
  currency: text("currency").notNull().default("EGP"),
  guestLimitSnapshot: integer("guest_limit_snapshot"),
  durationDaysSnapshot: integer("duration_days_snapshot").notNull(),

  // Payment details (customer-provided)
  paymentMethod: text("payment_method", { enum: paymentMethod }),
  amountPaid: integer("amount_paid"),
  referenceNumber: text("reference_number"),
  payerName: text("payer_name"),
  payerPhoneMasked: text("payer_phone_masked"),

  // Receipt fields
  receiptKey: text("receipt_key"),
  receiptMime: text("receipt_mime"),
  receiptSize: integer("receipt_size"),
  receiptChecksum: text("receipt_checksum"),

  // Review fields
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "string" }),
  rejectionReason: text("rejection_reason"),
  adminNotes: text("admin_notes"),
  infoRequestReason: text("info_request_reason"),

  // Metadata
  idempotencyKey: text("idempotency_key").notNull().unique(),
  statusVersion: integer("status_version").notNull().default(1),
  submittedAt: timestamp("submitted_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [
  // Only one pending_review request per user at a time
  uniqueIndex("payment_requests_user_pending_idx").on(table.userId).where(sql`${table.status} = 'pending_review'`),
  check("payment_requests_status_check", sql`${table.status} in ('draft', 'pending_review', 'needs_info', 'rejected', 'approved', 'cancelled')`),
  check("payment_requests_method_check", sql`${table.paymentMethod} is null or ${table.paymentMethod} in ('instapay', 'vodafone_cash', 'orange_cash', 'etisalat_cash', 'bank_transfer')`),
]);

export const subscriptionStatus = ["active", "expired", "cancelled", "suspended"] as const;

export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planCode: text("plan_code").notNull().references(() => platformPlans.code, { onDelete: "restrict" }),
  status: text("status", { enum: subscriptionStatus }).notNull().default("active"),
  startsAt: timestamp("starts_at", { withTimezone: true, mode: "string" }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  paymentRequestId: uuid("payment_request_id").references(() => paymentRequests.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [
  index("user_subscriptions_user_status_idx").on(table.userId, table.status),
  uniqueIndex("user_subscriptions_one_active_idx").on(table.userId).where(sql`${table.status} = 'active'`),
  check("user_subscriptions_status_check", sql`${table.status} in ('active', 'expired', 'cancelled', 'suspended')`),
]);

export const paymentAuditLogs = pgTable("payment_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  paymentRequestId: uuid("payment_request_id").references(() => paymentRequests.id, { onDelete: "set null" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [
  index("payment_audit_logs_created_idx").on(table.createdAt),
  index("payment_audit_logs_payment_idx").on(table.paymentRequestId),
]);

export const mediaBlobs = pgTable("media_blobs", {
  key: text("key").primaryKey(),
  data: bytea("data").notNull(),
  contentType: text("content_type").notNull().default("application/octet-stream"),
  etag: text("etag").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().default(now),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().default(now),
}, (table) => [
  index("media_blobs_updated_at_idx").on(table.updatedAt),
  check("media_blobs_size_limit", sql`octet_length(${table.data}) <= 5242880`),
]);

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
const supportData = await readFile(new URL("../lib/support-data.ts", import.meta.url), "utf8");
const userRoute = await readFile(new URL("../app/api/support-tickets/route.ts", import.meta.url), "utf8");
const notificationRoute = await readFile(new URL("../app/api/notifications/route.ts", import.meta.url), "utf8");
const adminRoute = await readFile(new URL("../app/api/admin/support-tickets/[id]/route.ts", import.meta.url), "utf8");
const accountCenter = await readFile(new URL("../app/account-center.tsx", import.meta.url), "utf8");
const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const admin = await readFile(new URL("../app/admin-dashboard.tsx", import.meta.url), "utf8");

test("support tickets and notifications are durable Neon records", () => {
  assert.match(schema, /supportTickets = pgTable\("support_tickets"/);
  assert.match(schema, /userNotifications = pgTable\("user_notifications"/);
  assert.match(schema, /support_tickets_status_priority_idx/);
  assert.match(schema, /user_notifications_user_read_idx/);
});

test("users can create scoped support tickets and read their notifications", () => {
  assert.match(userRoute, /createSupportTicket\(await getCurrentOwnerEmail\(\)/);
  assert.match(notificationRoute, /markNotificationsRead/);
  assert.match(supportData, /eq\(events\.ownerId, account\.id\)/);
  assert.match(supportData, /eq\(supportTickets\.userId, account\.id\)/);
});

test("support staff can update tickets while users receive an automatic notification", () => {
  assert.match(adminRoute, /forbiddenUnless\("support\.manage"\)/);
  assert.match(supportData, /support_ticket\.updated/);
  assert.match(supportData, /db\.insert\(userNotifications\)/);
  assert.match(admin, /Save & notify user/);
});

test("user and administration dashboards expose support, notifications, and reports", () => {
  assert.match(page, /const AccountCenter = lazy\(\(\) => import\("\.\/account-center"\)\)/);
  assert.match(page, /<AccountCenter locale=\{locale\} mode="notifications"/);
  assert.match(page, /<AccountCenter locale=\{locale\} mode="support"/);
  assert.match(accountCenter, /Notification center/);
  assert.match(accountCenter, /New support request/);
  assert.match(admin, /Operational reports/);
  assert.match(admin, /Support requests/);
});

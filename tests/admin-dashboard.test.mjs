import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const adminSource = await readFile(new URL("../app/admin-dashboard.tsx", import.meta.url), "utf8");
const adminDataSource = await readFile(new URL("../lib/admin-data.ts", import.meta.url), "utf8");
const schemaSource = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
const overviewRoute = await readFile(new URL("../app/api/admin/overview/route.ts", import.meta.url), "utf8");
const templateRoute = await readFile(new URL("../app/api/admin/templates/[code]/route.ts", import.meta.url), "utf8");
const roleRoute = await readFile(new URL("../app/api/admin/users/[id]/route.ts", import.meta.url), "utf8");
const planRoute = await readFile(new URL("../app/api/admin/plans/[code]/route.ts", import.meta.url), "utf8");
const contentRoute = await readFile(new URL("../app/api/admin/content/[key]/route.ts", import.meta.url), "utf8");
const publicConfigRoute = await readFile(new URL("../app/api/platform-content/route.ts", import.meta.url), "utf8");
const adminAuthSource = await readFile(new URL("../lib/admin-auth.ts", import.meta.url), "utf8");
const accountDataSource = await readFile(new URL("../lib/account-data.ts", import.meta.url), "utf8");
const workspacePage = await readFile(new URL("../app/workspace/page.tsx", import.meta.url), "utf8");
const adminPage = await readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8");

test("platform owner can open a bilingual administration workspace", () => {
  assert.match(pageSource, /type View = "home" \| "studio" \| "guest" \| "dashboard" \| "admin"/);
  assert.match(pageSource, /<AdminDashboard locale=\{locale\}/);
  assert.match(adminSource, /إدارة المستخدمين/);
  assert.match(adminSource, /Users & permissions/);
  assert.match(adminSource, /Invitation management/);
  assert.match(adminSource, /Template library/);
  assert.match(adminSource, /Plans & pricing/);
  assert.match(adminSource, /Content & translations/);
  assert.match(adminSource, /Administration audit log/);
});

test("roles, plans and bilingual content are durable and audited", () => {
  assert.match(schemaSource, /platformPlans = pgTable\("platform_plans"/);
  assert.match(schemaSource, /platformContent = pgTable\("platform_content"/);
  assert.match(schemaSource, /adminAuditLogs = pgTable\("admin_audit_logs"/);
  assert.match(roleRoute, /updateUserRole/);
  assert.match(planRoute, /updatePlatformPlan/);
  assert.match(contentRoute, /updatePlatformContent/);
  assert.match(adminDataSource, /user\.role_updated/);
  assert.match(adminDataSource, /plan\.updated/);
  assert.match(adminDataSource, /content\.updated/);
});

test("the owner account cannot lose administration access", () => {
  assert.match(adminDataSource, /target\.email === OWNER_EMAIL && role !== "admin"/);
  assert.match(adminDataSource, /The platform owner must remain an admin/);
});

test("public landing content and active plans come from Neon", () => {
  assert.match(publicConfigRoute, /getPublicPlatformConfig/);
  assert.match(adminDataSource, /from\(platformPlans\)\.where\(eq\(platformPlans\.active, true\)\)/);
  assert.match(pageSource, /fetch\("\/api\/platform-content"/);
  assert.match(pageSource, /plans=\{publicPlans\}/);
  assert.match(pageSource, /copy\("hero_primary_cta"/);
});

test("public template availability comes from Neon", () => {
  assert.match(adminDataSource, /platformTemplates\.active, true/);
  assert.match(adminDataSource, /return \{ content, plans, templates \}/);
  assert.match(pageSource, /mergePublicTemplates\(config\.templates\)/);
});

test("admin routes use a server-side role permission matrix", () => {
  assert.match(adminAuthSource, /overview\.read/);
  assert.match(adminAuthSource, /users\.manage/);
  assert.match(adminAuthSource, /content_manager/);
  assert.match(roleRoute, /forbiddenUnless\("users\.manage"\)/);
  assert.match(planRoute, /forbiddenUnless\("plans\.manage"\)/);
  assert.match(contentRoute, /forbiddenUnless\("content\.manage"\)/);
});

test("workspace and administration are sign-in gated server routes", () => {
  assert.match(workspacePage, /requirePlatformIdentity\("\/workspace"\)/);
  assert.match(adminPage, /requirePlatformIdentity\("\/admin"\)/);
  assert.match(adminPage, /\["admin", "support", "content_manager"\]/);
  assert.match(pageSource, /auth\/sign-in\?returnTo=%2Fworkspace/);
  assert.match(pageSource, /auth\/sign-out\?returnTo=%2F/);
});

test("authenticated identities receive durable Neon accounts", () => {
  assert.match(accountDataSource, /ensureAccount/);
  assert.match(accountDataSource, /where\(eq\(users\.email, email\)\)/);
  assert.match(accountDataSource, /role: email === PLATFORM_OWNER_EMAIL \? "admin" : "couple"/);
});

test("admin overview is backed by platform records", () => {
  assert.match(overviewRoute, /getAdminOverview/);
  assert.match(adminDataSource, /from\(users\)/);
  assert.match(adminDataSource, /from\(events\)/);
  assert.match(adminDataSource, /from\(guests\)/);
  assert.match(adminDataSource, /leftJoin\(invitations/);
});

test("template availability is durable and owner-controlled", () => {
  assert.match(schemaSource, /platformTemplates = pgTable\("platform_templates"/);
  assert.match(templateRoute, /updatePlatformTemplate/);
  assert.match(templateRoute, /typeof payload\.active !== "boolean"/);
  assert.match(adminSource, /api\/admin\/templates/);
});

test("administrators retain complete section navigation on mobile", () => {
  assert.match(adminSource, /className="admin-mobile-tabs"/);
  assert.match(adminSource, /Admin dashboard sections/);
  assert.match(adminSource, /icon: LayoutTemplate/);
});

test("administration code is split from the public landing bundle", () => {
  assert.match(pageSource, /const AdminDashboard = lazy\(\(\) => import\("\.\/admin-dashboard"\)\)/);
  assert.match(pageSource, /<Suspense fallback=\{<BuilderLoading locale=\{locale\} \/>\}>/);
});

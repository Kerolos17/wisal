import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { getCurrentOwnerEmail } from "@/lib/current-owner";
import type { PlatformRole } from "@/lib/admin-data";

export type AdminPermission = "overview.read" | "users.manage" | "templates.manage" | "plans.manage" | "content.manage" | "support.manage" | "payments.review";

const permissions: Record<PlatformRole, AdminPermission[]> = {
  admin: ["overview.read", "users.manage", "templates.manage", "plans.manage", "content.manage", "support.manage", "payments.review"],
  support: ["overview.read", "support.manage"],
  content_manager: ["overview.read", "templates.manage", "content.manage"],
  couple: [],
};

export async function hasAdminPermission(permission: AdminPermission) {
  const email = await getCurrentOwnerEmail();
  const db = getDb();
  const [account] = await db.select({ role: users.role }).from(users).where(eq(users.email, email)).limit(1);
  if (!account) return false;
  return permissions[account.role as PlatformRole]?.includes(permission) ?? false;
}

export async function forbiddenUnless(permission: AdminPermission) {
  return await hasAdminPermission(permission) ? null : Response.json({ error: "Forbidden" }, { status: 403 });
}

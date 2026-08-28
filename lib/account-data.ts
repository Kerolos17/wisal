import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import type { PlatformIdentity } from "@/lib/auth/identity";
import { isPlatformOwner } from "@/lib/platform-owner";

export async function ensureAccount(identity: PlatformIdentity) {
  const db = getDb();
  const email = identity.email.toLowerCase();
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    const role = isPlatformOwner(email) ? "admin" : existing.role;
    const [updated] = await db.update(users).set({ displayName: identity.displayName, role, updatedAt: new Date().toISOString() }).where(eq(users.id, existing.id)).returning();
    return { displayName: updated.displayName, email: updated.email, role: updated.role };
  }
  const [created] = await db.insert(users).values({ email, displayName: identity.displayName, role: isPlatformOwner(email) ? "admin" : "couple" }).returning();
  return { displayName: created.displayName, email: created.email, role: created.role };
}

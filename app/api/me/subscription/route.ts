import { getPlatformIdentity } from "@/lib/auth/identity";
import { getActiveSubscription } from "@/lib/payments";
import { getDb } from "@/db";
import { users, paymentRequests } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });
  const [user] = await getDb().select({ id: users.id }).from(users).where(eq(users.email, identity.email)).limit(1);
  if (!user) return Response.json({ planCode: null, status: null, expiresAt: null, latestPaymentStatus: null });
  const sub = await getActiveSubscription(user.id);
  const [latestPayment] = await getDb()
    .select({ status: paymentRequests.status })
    .from(paymentRequests)
    .where(eq(paymentRequests.userId, user.id))
    .orderBy(desc(paymentRequests.createdAt))
    .limit(1);
  return Response.json({
    planCode: sub?.planCode ?? null,
    status: sub?.status ?? null,
    expiresAt: sub?.expiresAt ?? null,
    latestPaymentStatus: latestPayment?.status ?? null,
  });
}

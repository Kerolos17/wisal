import { getPlatformIdentity } from "@/lib/auth/identity";
import { getActiveSubscription } from "@/lib/payments";
import { getDb } from "@/db";
import { users, paymentRequests, platformPlans } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });
  const [user] = await getDb().select({ id: users.id }).from(users).where(eq(users.email, identity.email)).limit(1);
  if (!user) return Response.json({ planCode: null, planNameAr: null, planNameEn: null, status: null, expiresAt: null, latestPaymentId: null, latestPaymentPlanCode: null, latestPaymentStatus: null });
  const sub = await getActiveSubscription(user.id);
  const [subscriptionPlan] = sub ? await getDb().select({ nameAr: platformPlans.nameAr, nameEn: platformPlans.nameEn }).from(platformPlans).where(eq(platformPlans.code, sub.planCode)).limit(1) : [];
  const [latestPayment] = await getDb()
    .select({ id: paymentRequests.id, planCode: paymentRequests.planCode, status: paymentRequests.status })
    .from(paymentRequests)
    .where(eq(paymentRequests.userId, user.id))
    .orderBy(desc(paymentRequests.createdAt))
    .limit(1);
  return Response.json({
    planCode: sub?.planCode ?? null,
    planNameAr: subscriptionPlan?.nameAr ?? null,
    planNameEn: subscriptionPlan?.nameEn ?? null,
    status: sub?.status ?? null,
    expiresAt: sub?.expiresAt ?? null,
    latestPaymentId: latestPayment?.id ?? null,
    latestPaymentPlanCode: latestPayment?.planCode ?? null,
    latestPaymentStatus: latestPayment?.status ?? null,
  });
}

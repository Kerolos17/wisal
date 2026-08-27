import { getPlatformIdentity } from "@/lib/auth/identity";
import { listPaymentRequests, paymentErrorStatus } from "@/lib/payments";
import { forbiddenUnless } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Payment requests contain payer PII; restrict to full admins only.
    const forbidden = await forbiddenUnless("users.manage");
    if (forbidden) return forbidden;

    const identity = await getPlatformIdentity();
    if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });

    const payments = await listPaymentRequests(identity);
    return Response.json({ payments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to list payments";
    return Response.json({ error: message }, { status: paymentErrorStatus(error) });
  }
}

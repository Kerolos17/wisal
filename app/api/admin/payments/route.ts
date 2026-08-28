import { getPlatformIdentity } from "@/lib/auth/identity";
import { listPaymentRequests } from "@/lib/payments";
import { forbiddenUnless } from "@/lib/admin-auth";
import { paymentApiErrorResponse } from "@/lib/payment-api-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Payment requests contain payer PII; require the dedicated review permission.
    const forbidden = await forbiddenUnless("payments.review");
    if (forbidden) return forbidden;

    const identity = await getPlatformIdentity();
    if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });

    const payments = await listPaymentRequests(identity);
    return Response.json({ payments });
  } catch (error) {
    return paymentApiErrorResponse(error, "Unable to list payments");
  }
}

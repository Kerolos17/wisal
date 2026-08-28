import { getPlatformIdentity } from "@/lib/auth/identity";
import { cancelPaymentRequest } from "@/lib/payments";
import { paymentApiErrorResponse } from "@/lib/payment-api-error";

export const dynamic = "force-dynamic";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });

    const { id } = await params;
    const payment = await cancelPaymentRequest(identity, id);
    return Response.json({ payment });
  } catch (error) {
    return paymentApiErrorResponse(error, "Unable to cancel payment request");
  }
}

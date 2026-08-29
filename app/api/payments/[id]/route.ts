import { getPlatformIdentity } from "@/lib/auth/identity";
import { getOwnPaymentRequest } from "@/lib/payments";
import { paymentApiErrorResponse } from "@/lib/payment-api-error";

export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store" };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return Response.json({ error: "Authentication required" }, { status: 401, headers: privateHeaders });

    const { id } = await params;
    const payment = await getOwnPaymentRequest(identity, id);
    if (!payment) return Response.json({ error: "Payment request not found" }, { status: 404, headers: privateHeaders });
    return Response.json({ payment }, { headers: privateHeaders });
  } catch (error) {
    const response = paymentApiErrorResponse(error, "Unable to load payment request");
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}

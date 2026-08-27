import { getPlatformIdentity } from "@/lib/auth/identity";
import { getOwnPaymentRequest, paymentErrorStatus } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });

    const { id } = await params;
    const payment = await getOwnPaymentRequest(identity, id);
    if (!payment) return Response.json({ error: "Payment request not found" }, { status: 404 });
    return Response.json({ payment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load payment request";
    return Response.json({ error: message }, { status: paymentErrorStatus(error) });
  }
}

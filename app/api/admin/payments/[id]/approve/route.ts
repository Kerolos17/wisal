import { getPlatformIdentity } from "@/lib/auth/identity";
import { approvePaymentRequest, paymentErrorStatus } from "@/lib/payments";
import { forbiddenUnless } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const forbidden = await forbiddenUnless("users.manage");
    if (forbidden) return forbidden;

    const identity = await getPlatformIdentity();
    if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });

    const { id } = await params;
    const body = await request.json() as { statusVersion?: unknown };
    if (typeof body.statusVersion !== "number") return Response.json({ error: "statusVersion is required" }, { status: 400 });

    const payment = await approvePaymentRequest(identity, id, body.statusVersion);
    return Response.json({ payment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to approve payment";
    return Response.json({ error: message }, { status: paymentErrorStatus(error) });
  }
}

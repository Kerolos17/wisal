import { getPlatformIdentity } from "@/lib/auth/identity";
import { rejectPaymentRequest } from "@/lib/payments";
import { forbiddenUnless } from "@/lib/admin-auth";
import { paymentApiErrorResponse } from "@/lib/payment-api-error";
import { readJsonBody } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const forbidden = await forbiddenUnless("payments.review");
    if (forbidden) return forbidden;

    const identity = await getPlatformIdentity();
    if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });

    const { id } = await params;
    const body = await readJsonBody(request) as { statusVersion?: unknown; reason?: unknown };
    if (typeof body.statusVersion !== "number") return Response.json({ error: "statusVersion is required" }, { status: 400 });
    if (typeof body.reason !== "string" || !body.reason.trim()) return Response.json({ error: "Rejection reason is required" }, { status: 400 });

    const payment = await rejectPaymentRequest(identity, id, body.statusVersion, body.reason.trim());
    return Response.json({ payment });
  } catch (error) {
    return paymentApiErrorResponse(error, "Unable to reject payment");
  }
}

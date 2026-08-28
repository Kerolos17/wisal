import { getPlatformIdentity } from "@/lib/auth/identity";
import { createPaymentRequest } from "@/lib/payments";
import { paymentApiErrorResponse } from "@/lib/payment-api-error";
import { readJsonBody } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });

    const body = await readJsonBody(request) as { planCode?: unknown; idempotencyKey?: unknown };
    if (typeof body.planCode !== "string") return Response.json({ error: "planCode is required" }, { status: 400 });
    if (typeof body.idempotencyKey !== "string") return Response.json({ error: "idempotencyKey is required" }, { status: 400 });

    const payment = await createPaymentRequest(identity, { planCode: body.planCode, idempotencyKey: body.idempotencyKey });
    return Response.json({ payment }, { status: 201 });
  } catch (error) {
    return paymentApiErrorResponse(error, "Unable to create payment request");
  }
}

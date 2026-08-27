import { getPlatformIdentity } from "@/lib/auth/identity";
import { createPaymentRequest } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });

    const body = await request.json() as { planCode?: unknown; idempotencyKey?: unknown };
    if (typeof body.planCode !== "string") return Response.json({ error: "planCode is required" }, { status: 400 });
    if (typeof body.idempotencyKey !== "string") return Response.json({ error: "idempotencyKey is required" }, { status: 400 });

    const payment = await createPaymentRequest(identity, { planCode: body.planCode, idempotencyKey: body.idempotencyKey });
    return Response.json({ payment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create payment request";
    const status = (error as { code?: string }).code === "CONFLICT" ? 409 : 400;
    return Response.json({ error: message }, { status: (error as { code?: string }).code === "CONFLICT" ? status : 500 });
  }
}

import { getPlatformIdentity } from "@/lib/auth/identity";
import { requestInfoPaymentRequest } from "@/lib/payments";
import { forbiddenUnless } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const forbidden = await forbiddenUnless("overview.read");
    if (forbidden) return forbidden;

    const identity = await getPlatformIdentity();
    if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });

    const { id } = await params;
    const body = await request.json() as { statusVersion?: unknown; reason?: unknown };
    if (typeof body.statusVersion !== "number") return Response.json({ error: "statusVersion is required" }, { status: 400 });
    if (typeof body.reason !== "string" || !body.reason.trim()) return Response.json({ error: "Info request reason is required" }, { status: 400 });

    const payment = await requestInfoPaymentRequest(identity, id, body.statusVersion, body.reason.trim());
    return Response.json({ payment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to request info";
    const status = (error as { code?: string }).code === "CONFLICT" ? 409 : 400;
    return Response.json({ error: message }, { status: (error as { code?: string }).code === "CONFLICT" ? status : 500 });
  }
}

import { getPlatformIdentity } from "@/lib/auth/identity";
import { listPaymentRequests } from "@/lib/payments";
import { forbiddenUnless } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const forbidden = await forbiddenUnless("overview.read");
    if (forbidden) return forbidden;

    const identity = await getPlatformIdentity();
    if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });

    const payments = await listPaymentRequests(identity);
    return Response.json({ payments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to list payments";
    return Response.json({ error: message }, { status: 500 });
  }
}

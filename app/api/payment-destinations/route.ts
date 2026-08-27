import { getPlatformIdentity } from "@/lib/auth/identity";
import { listActivePaymentDestinations } from "@/lib/payment-destinations";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });
  return Response.json({ destinations: await listActivePaymentDestinations() }, { headers: { "Cache-Control": "private, no-store" } });
}

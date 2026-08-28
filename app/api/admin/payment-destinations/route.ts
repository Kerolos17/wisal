import { forbiddenUnless } from "@/lib/admin-auth";
import { listPaymentDestinations, parsePaymentDestination, savePaymentDestinations } from "@/lib/payment-destinations";
import { apiErrorResponse } from "@/lib/api-error";
import { readJsonBody } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const forbidden = await forbiddenUnless("payments.review");
  if (forbidden) return forbidden;
  return Response.json({ destinations: await listPaymentDestinations() }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(request: Request) {
  try {
    const forbidden = await forbiddenUnless("payments.review");
    if (forbidden) return forbidden;
    const payload = await readJsonBody(request) as { destinations?: unknown };
    if (!Array.isArray(payload.destinations) || payload.destinations.length > 5) return Response.json({ error: "Invalid payment destinations" }, { status: 400 });
    const destinations = payload.destinations.map(parsePaymentDestination);
    const unique = new Set(destinations.map((destination) => destination.method));
    if (unique.size !== destinations.length) return Response.json({ error: "Payment methods must be unique" }, { status: 400 });
    return Response.json({ destinations: await savePaymentDestinations(destinations) });
  } catch (error) {
    return apiErrorResponse(error, { message: "Unable to save payment destinations", status: 400 });
  }
}

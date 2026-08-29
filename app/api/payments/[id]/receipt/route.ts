import { getPlatformIdentity } from "@/lib/auth/identity";
import { getOwnPaymentRequest } from "@/lib/payments";
import { readReceipt } from "@/lib/payment-storage";
import { apiErrorResponse } from "@/lib/api-error";

export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store" };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return new Response("Authentication required", { status: 401, headers: privateHeaders });

    const { id } = await params;
    const payment = await getOwnPaymentRequest(identity, id);
    if (!payment) return new Response("Not found", { status: 404, headers: privateHeaders });
    if (!payment.hasReceipt) return new Response("No receipt", { status: 404, headers: privateHeaders });

    // Re-fetch the raw receipt key from the request row (not exposed in serialized form)
    const db = (await import("@/db")).getDb();
    const { paymentRequests } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const [row] = await db.select({ receiptKey: paymentRequests.receiptKey, receiptMime: paymentRequests.receiptMime })
      .from(paymentRequests).where(eq(paymentRequests.id, id)).limit(1);
    if (!row?.receiptKey) return new Response("No receipt", { status: 404, headers: privateHeaders });

    const receipt = await readReceipt(row.receiptKey);
    if (!receipt) return new Response("Not found", { status: 404, headers: privateHeaders });

    return new Response(receipt.body, {
      headers: {
        "content-type": receipt.contentType,
        ...privateHeaders,
      },
    });
  } catch (error) {
    const response = apiErrorResponse(error, { message: "Unable to load receipt" });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}

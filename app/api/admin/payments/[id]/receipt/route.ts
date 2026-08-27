import { getPlatformIdentity } from "@/lib/auth/identity";
import { forbiddenUnless } from "@/lib/admin-auth";
import { readReceipt } from "@/lib/payment-storage";
import { paymentErrorStatus } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Receipts contain payer PII (name, reference). Restrict to full admins only.
    const forbidden = await forbiddenUnless("users.manage");
    if (forbidden) return forbidden;

    const identity = await getPlatformIdentity();
    if (!identity) return new Response("Authentication required", { status: 401 });

    const { id } = await params;

    // Load receipt key for the given payment request (admin may view any)
    const db = (await import("@/db")).getDb();
    const { paymentRequests } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const [row] = await db.select({ receiptKey: paymentRequests.receiptKey, receiptMime: paymentRequests.receiptMime })
      .from(paymentRequests).where(eq(paymentRequests.id, id)).limit(1);
    if (!row?.receiptKey) return new Response("No receipt", { status: 404 });

    const receipt = await readReceipt(row.receiptKey);
    if (!receipt) return new Response("Not found", { status: 404 });

    return new Response(receipt.body, {
      headers: {
        "content-type": receipt.contentType,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load receipt";
    return new Response(message, { status: paymentErrorStatus(error) });
  }
}

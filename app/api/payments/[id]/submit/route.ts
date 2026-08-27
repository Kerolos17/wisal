import { getPlatformIdentity } from "@/lib/auth/identity";
import { submitPaymentRequest } from "@/lib/payments";
import { storeReceipt } from "@/lib/payment-storage";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });

    const { id } = await params;
    const form = await request.formData();
    const file = form.get("receipt");
    const paymentMethod = form.get("paymentMethod");
    const amountPaid = form.get("amountPaid");
    const referenceNumber = form.get("referenceNumber");
    const payerName = form.get("payerName");
    const payerPhoneMasked = form.get("payerPhoneMasked");

    if (!(file instanceof File)) return Response.json({ error: "Receipt file is required" }, { status: 400 });
    if (typeof paymentMethod !== "string" || !["instapay", "vodafone_cash", "etisalat_cash", "bank_transfer"].includes(paymentMethod)) {
      return Response.json({ error: "Valid payment method is required" }, { status: 400 });
    }
    const amount = Number(amountPaid);
    if (!Number.isFinite(amount) || amount < 0) return Response.json({ error: "Valid amount is required" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const receipt = await storeReceipt(identity.email, id, buffer, file.type);

    const payment = await submitPaymentRequest(
      identity,
      id,
      { key: receipt.key, mime: file.type, size: receipt.size, checksum: receipt.checksum },
      {
        paymentMethod,
        amountPaid: amount,
        referenceNumber: typeof referenceNumber === "string" ? referenceNumber : undefined,
        payerName: typeof payerName === "string" ? payerName : undefined,
        payerPhoneMasked: typeof payerPhoneMasked === "string" ? payerPhoneMasked : undefined,
      },
    );
    return Response.json({ payment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit payment";
    const status = (error as { code?: string }).code === "CONFLICT" ? 409 : 400;
    return Response.json({ error: message }, { status: (error as { code?: string }).code === "CONFLICT" ? status : 500 });
  }
}

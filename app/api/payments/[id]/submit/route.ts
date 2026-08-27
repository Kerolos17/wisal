import { getPlatformIdentity } from "@/lib/auth/identity";
import { getOwnPaymentRequest, submitPaymentRequest, paymentErrorStatus } from "@/lib/payments";
import { MAX_RECEIPT_BYTES, storeReceipt } from "@/lib/payment-storage";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });

    const { id } = await params;
    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_RECEIPT_BYTES + 512 * 1024) {
      return Response.json({ error: "Receipt upload is too large" }, { status: 413 });
    }
    const form = await request.formData();
    const file = form.get("receipt");
    const paymentMethod = form.get("paymentMethod");
    const amountPaid = form.get("amountPaid");
    const referenceNumber = form.get("referenceNumber");
    const payerName = form.get("payerName");
    const payerPhone = form.get("payerPhoneMasked");

    if (!(file instanceof File)) return Response.json({ error: "Receipt file is required" }, { status: 400 });
    if (file.size > MAX_RECEIPT_BYTES) return Response.json({ error: "Receipt file is too large" }, { status: 413 });
    if (typeof paymentMethod !== "string" || !["instapay", "vodafone_cash", "etisalat_cash", "bank_transfer"].includes(paymentMethod)) {
      return Response.json({ error: "Valid payment method is required" }, { status: 400 });
    }
    const amount = Number(amountPaid);
    if (!Number.isInteger(amount) || amount < 0) return Response.json({ error: "Valid amount is required" }, { status: 400 });

    const payment = await getOwnPaymentRequest(identity, id);
    if (!payment) return Response.json({ error: "Payment request not found" }, { status: 404 });
    if (amount !== payment.priceEgpSnapshot) return Response.json({ error: "Payment amount does not match plan price" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const receipt = await storeReceipt(payment.userId, id, buffer, file.type);

    const submittedPayment = await submitPaymentRequest(
      identity,
      id,
      { key: receipt.key, mime: file.type, size: receipt.size, checksum: receipt.checksum },
      {
        paymentMethod,
        amountPaid: amount,
        referenceNumber: typeof referenceNumber === "string" ? referenceNumber : undefined,
        payerName: typeof payerName === "string" ? payerName : undefined,
        payerPhoneMasked: typeof payerPhone === "string" && payerPhone.replace(/\D/g, "").length > 0
          ? `••••${payerPhone.replace(/\D/g, "").slice(-4)}`
          : undefined,
      },
    );
    return Response.json({ payment: submittedPayment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit payment";
    return Response.json({ error: message }, { status: paymentErrorStatus(error) });
  }
}

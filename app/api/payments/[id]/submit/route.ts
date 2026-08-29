import { getPlatformIdentity } from "@/lib/auth/identity";
import { getOwnPaymentSubmission, submitPaymentRequest } from "@/lib/payments";
import { deleteReceipt, MAX_RECEIPT_BYTES, storeReceipt } from "@/lib/payment-storage";
import { listActivePaymentDestinations } from "@/lib/payment-destinations";
import { submitStoredReceipt } from "@/lib/payment-receipt-submission";
import { paymentApiErrorResponse } from "@/lib/payment-api-error";
import { guardSharedRateLimit } from "@/lib/public-api-guard";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });

    const { id } = await params;
    const payment = await getOwnPaymentSubmission(identity, id);
    if (!payment) return Response.json({ error: "Payment request not found" }, { status: 404 });
    const rateLimited = await guardSharedRateLimit(`payment-receipt:${payment.userId}`, { limit: 6, windowMs: 15 * 60_000 });
    if (rateLimited) return rateLimited;

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
    if (typeof paymentMethod !== "string" || !["instapay", "vodafone_cash", "orange_cash", "etisalat_cash", "bank_transfer"].includes(paymentMethod)) {
      return Response.json({ error: "Valid payment method is required" }, { status: 400 });
    }
    const activeDestinations = await listActivePaymentDestinations();
    if (!activeDestinations.some((destination) => destination.method === paymentMethod)) {
      return Response.json({ error: "Selected payment method is unavailable" }, { status: 400 });
    }
    const amount = Number(amountPaid);
    if (!Number.isInteger(amount) || amount < 0) return Response.json({ error: "Valid amount is required" }, { status: 400 });

    if (amount !== payment.priceEgpSnapshot) return Response.json({ error: "Payment amount does not match plan price" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const submittedPayment = await submitStoredReceipt({
      previousReceiptKey: payment.receiptKey,
      store: () => storeReceipt(payment.userId, id, buffer, file.type),
      submit: (receipt) => submitPaymentRequest(
        identity,
        id,
        receipt,
        {
          paymentMethod,
          amountPaid: amount,
          referenceNumber: typeof referenceNumber === "string" ? referenceNumber : undefined,
          payerName: typeof payerName === "string" ? payerName : undefined,
          payerPhoneMasked: typeof payerPhone === "string" && payerPhone.replace(/\D/g, "").length > 0
            ? `••••${payerPhone.replace(/\D/g, "").slice(-4)}`
            : undefined,
        },
      ),
      discard: deleteReceipt,
    });
    return Response.json({ payment: submittedPayment });
  } catch (error) {
    return paymentApiErrorResponse(error, "Unable to submit payment");
  }
}

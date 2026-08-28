import { apiErrorResponse } from "@/lib/api-error";
import { paymentErrorStatus } from "@/lib/payments";

export function paymentApiErrorResponse(error: unknown, fallback: string) {
  const status = paymentErrorStatus(error);
  const message = status === 403
    ? "You are not permitted to perform this payment action"
    : status === 404
      ? "Payment request not found"
      : status === 409
        ? "Payment request has changed. Refresh and try again"
        : status === 400
          ? "Payment request could not be processed"
          : fallback;

  return apiErrorResponse(error, { message, status });
}

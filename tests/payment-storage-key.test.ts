import test from "node:test";
import assert from "node:assert/strict";
import { createReceiptStorageKey } from "@/lib/payment-storage";

test("receipt storage keys are unique per upload attempt and stay private", () => {
  const first = createReceiptStorageKey("user-1", "payment-1", "application/pdf", "attempt-1");
  const second = createReceiptStorageKey("user-1", "payment-1", "application/pdf", "attempt-2");
  assert.match(first, /^receipts\/user-1\/payment-1\/attempt-1\.pdf$/);
  assert.notEqual(first, second);
});

import test from "node:test";
import assert from "node:assert/strict";
import { submitStoredReceipt } from "@/lib/payment-receipt-submission";

test("discards a newly stored receipt when the payment transition fails", async () => {
  const deleted: string[] = [];
  await assert.rejects(
    () => submitStoredReceipt({
      previousReceiptKey: "receipts/user/request/old.pdf",
      store: async () => ({ key: "receipts/user/request/new.pdf", mime: "application/pdf", size: 12, checksum: "new" }),
      submit: async () => { throw new Error("Payment request is not in a submittable state"); },
      discard: async (key) => { deleted.push(key); },
    }),
    /submittable state/,
  );
  assert.deepEqual(deleted, ["receipts/user/request/new.pdf"]);
});

test("keeps the new receipt and clears the previous receipt only after success", async () => {
  const deleted: string[] = [];
  const result = await submitStoredReceipt({
    previousReceiptKey: "receipts/user/request/old.pdf",
    store: async () => ({ key: "receipts/user/request/new.pdf", mime: "application/pdf", size: 12, checksum: "new" }),
    submit: async () => "pending_review",
    discard: async (key) => { deleted.push(key); },
  });
  assert.equal(result, "pending_review");
  assert.deepEqual(deleted, ["receipts/user/request/old.pdf"]);
});

test("does not delete the current receipt when no previous receipt exists", async () => {
  const deleted: string[] = [];
  await submitStoredReceipt({
    previousReceiptKey: null,
    store: async () => ({ key: "receipts/user/request/new.pdf", mime: "application/pdf", size: 12, checksum: "new" }),
    submit: async () => "pending_review",
    discard: async (key) => { deleted.push(key); },
  });
  assert.deepEqual(deleted, []);
});

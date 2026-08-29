import test from "node:test";
import assert from "node:assert/strict";
import { configurePaymentTestEnvironment } from "./helpers/payment-test-environment.mjs";
import {
  createReceiptStorageKey,
  deleteReceipt,
  MAX_RECEIPT_BYTES,
  readReceipt,
  storeReceipt,
} from "@/lib/payment-storage";

configurePaymentTestEnvironment();

test("receipt storage keys are unique per upload attempt and stay private", () => {
  const first = createReceiptStorageKey("user-1", "payment-1", "application/pdf", "attempt-1");
  const second = createReceiptStorageKey("user-1", "payment-1", "application/pdf", "attempt-2");
  assert.match(first, /^receipts\/user-1\/payment-1\/attempt-1\.pdf$/);
  assert.notEqual(first, second);
});

test("valid receipt image and PDF signatures round-trip through staging storage", async () => {
  const fixtures = [
    { mime: "image/jpeg", bytes: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]) },
    { mime: "image/png", bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]) },
    { mime: "image/webp", bytes: Buffer.from("RIFF\u0004\u0000\u0000\u0000WEBP", "binary") },
    { mime: "application/pdf", bytes: Buffer.from("%PDF-1.7\n%%EOF", "ascii") },
  ];

  for (const fixture of fixtures) {
    const stored = await storeReceipt("storage-test-user", "storage-test-payment", fixture.bytes, fixture.mime);
    try {
      assert.equal(stored.mime, fixture.mime);
      assert.equal(stored.size, fixture.bytes.byteLength);
      assert.match(stored.checksum, /^[a-f0-9]{64}$/);
      const restored = await readReceipt(stored.key);
      assert.ok(restored);
      assert.equal(restored.contentType, fixture.mime);
      assert.deepEqual(Buffer.from(await restored.body.arrayBuffer()), fixture.bytes);
    } finally {
      await deleteReceipt(stored.key);
    }
    assert.equal(await readReceipt(stored.key), null);
  }
});

test("receipt storage rejects spoofed, unsupported, and oversized files before writing", async () => {
  await assert.rejects(
    () => storeReceipt("storage-test-user", "spoofed", Buffer.from("not-a-pdf"), "application/pdf"),
    /does not match/,
  );
  await assert.rejects(
    () => storeReceipt("storage-test-user", "unsupported", Buffer.from("GIF89a"), "image/gif"),
    /Invalid receipt file type/,
  );
  await assert.rejects(
    () => storeReceipt("storage-test-user", "oversized", Buffer.alloc(MAX_RECEIPT_BYTES + 1), "image/png"),
    /too large/,
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("checkout QR dialog has keyboard focus containment and restoration contracts", () => {
  const source = read("app/checkout/checkout-client.tsx");
  assert.match(source, /aria-haspopup="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /onKeyDown=\{trapQrFocus\}/);
  assert.match(source, /qrCloseRef\.current\?\.focus\(\)/);
  assert.match(source, /if \(!qrOpen && hadBeenOpen\) qrTriggerRef\.current\?\.focus\(\)/);
});

test("payment state conflicts are reported as conflicts instead of generic validation errors", () => {
  const source = read("lib/payments.ts");
  assert.match(source, /message === "Payment request is not in a submittable state"\) return 409/);
});

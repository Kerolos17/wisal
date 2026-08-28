import test from "node:test";
import assert from "node:assert/strict";
import { configurePaymentTestEnvironment } from "./helpers/payment-test-environment.mjs";

test("payment database tests require an explicit isolated database", () => {
  assert.throws(
    () => configurePaymentTestEnvironment({ env: { DATABASE_URL: "postgres://live" }, runtime: {} }),
    /PAYMENT_TEST_MODE=enabled/,
  );
  assert.throws(
    () => configurePaymentTestEnvironment({ env: { PAYMENT_TEST_MODE: "enabled", DATABASE_URL: "postgres://live" }, runtime: {} }),
    /PAYMENT_TEST_DATABASE_URL/,
  );
  assert.throws(
    () => configurePaymentTestEnvironment({
      env: { PAYMENT_TEST_MODE: "enabled", DATABASE_URL: "postgres://same", PAYMENT_TEST_DATABASE_URL: "postgres://same" },
      runtime: {},
    }),
    /must not match/,
  );
});

test("payment database tests redirect only the test runtime to its isolated URL", () => {
  const env = { PAYMENT_TEST_MODE: "enabled", DATABASE_URL: "postgres://application", PAYMENT_TEST_DATABASE_URL: "postgres://payment-test" };
  const runtime = {};
  assert.equal(configurePaymentTestEnvironment({ env, runtime }), "postgres://payment-test");
  assert.equal(env.DATABASE_URL, "postgres://payment-test");
  assert.equal(runtime.__WISAL_ENV__.DATABASE_URL, "postgres://payment-test");
});

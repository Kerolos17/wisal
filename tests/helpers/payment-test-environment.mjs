const TEST_MODE = "enabled";

function normalized(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Makes database-mutating payment tests explicit and isolated.
 *
 * The normal application DATABASE_URL must never be reused for these tests.
 * Call this before the first getDb() invocation in every mutating test file.
 */
export function configurePaymentTestEnvironment({ env = process.env, runtime = globalThis } = {}) {
  const testUrl = normalized(env.PAYMENT_TEST_DATABASE_URL);
  const applicationUrl = normalized(env.DATABASE_URL);

  if (env.PAYMENT_TEST_MODE !== TEST_MODE) {
    throw new Error("Payment database tests require PAYMENT_TEST_MODE=enabled.");
  }
  if (!testUrl) {
    throw new Error("Payment database tests require PAYMENT_TEST_DATABASE_URL.");
  }
  if (applicationUrl && applicationUrl === testUrl) {
    throw new Error("PAYMENT_TEST_DATABASE_URL must not match DATABASE_URL.");
  }

  env.DATABASE_URL = testUrl;
  runtime.__WISAL_ENV__ = { ...(runtime.__WISAL_ENV__ ?? {}), DATABASE_URL: testUrl };
  return testUrl;
}

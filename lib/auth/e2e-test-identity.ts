import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";

export type E2ETestIdentity = {
  displayName: string;
  email: string;
  fullName: string;
};

const enabled = () => process.env.WISAL_E2E_TEST_MODE === "enabled" && process.env.NODE_ENV !== "production";

function secretsMatch(actual: string | null, expected: string | undefined) {
  if (!actual || !expected || actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

/**
 * Test-only identity seam for the mutable Playwright suite.
 *
 * It deliberately cannot activate in production and requires a separate
 * high-entropy token. It is not an authentication fallback for the product.
 */
export async function getE2ETestIdentity(): Promise<E2ETestIdentity | null> {
  if (!enabled()) return null;

  const requestHeaders = await headers();
  if (!secretsMatch(requestHeaders.get("x-wisal-e2e-token"), process.env.WISAL_E2E_TEST_TOKEN)) return null;

  const email = requestHeaders.get("x-wisal-e2e-identity")?.trim().toLowerCase() ?? "";
  if (!/^[^\s@]+@[^\s@]+\.invalid$/.test(email)) return null;

  const displayName = email.split("@")[0].replace(/[._-]+/g, " ") || "Wisal E2E";
  return { email, displayName, fullName: displayName };
}

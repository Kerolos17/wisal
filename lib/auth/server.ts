import { createNeonAuth } from "@neondatabase/auth/next/server";

export const isNeonAuthEnabled = () => process.env.WISAL_AUTH_PROVIDER === "neon";

let auth: ReturnType<typeof createNeonAuth> | null = null;

export function getNeonAuth() {
  if (auth) return auth;

  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl) throw new Error("NEON_AUTH_BASE_URL is required when Neon Auth is enabled");
  if (!secret || secret.length < 32) throw new Error("NEON_AUTH_COOKIE_SECRET must contain at least 32 characters");

  auth = createNeonAuth({
    baseUrl,
    cookies: { secret, sessionDataTtl: 300 },
    logLevel: process.env.NODE_ENV === "production" ? "warn" : "info",
  });
  return auth;
}

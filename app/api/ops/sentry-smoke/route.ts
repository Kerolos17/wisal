import { timingSafeEqual } from "node:crypto";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const notFoundHeaders = { "Cache-Control": "no-store" };

function hasValidSmokeToken(request: Request, expectedToken: string) {
  const providedToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const providedBytes = new TextEncoder().encode(providedToken);
  const expectedBytes = new TextEncoder().encode(expectedToken);

  return providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes);
}

export async function POST(request: Request) {
  const smokeToken = process.env.SENTRY_SMOKE_TEST_TOKEN;

  // This diagnostic endpoint must never be reachable from production or local
  // environments. Vercel sets VERCEL_ENV to "preview" for preview deployments.
  if (process.env.VERCEL_ENV !== "preview" || !smokeToken || !hasValidSmokeToken(request, smokeToken)) {
    return new Response(null, { status: 404, headers: notFoundHeaders });
  }

  Sentry.withScope((scope) => {
    scope.setTag("ops_smoke", "preview");
    scope.setLevel("error");
    Sentry.captureException(new Error("Wisal preview Sentry smoke check"));
  });

  await Sentry.flush(2000);

  return Response.json({ accepted: true }, { headers: { "Cache-Control": "no-store" } });
}

type GuardOptions = {
  limit: number;
  windowMs?: number;
  maxBodyBytes?: number;
};

type RateWindow = { count: number; resetAt: number };

const rateWindows = new Map<string, RateWindow>();

const noStoreHeaders = { "Cache-Control": "no-store" };

function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return request.headers.get("cf-connecting-ip")?.trim() || forwarded || "local";
}

function cleanupExpiredWindows(now: number) {
  if (rateWindows.size < 2_000) return;
  for (const [key, value] of rateWindows) {
    if (value.resetAt <= now) rateWindows.delete(key);
  }
}

export async function guardPublicJsonRequest(request: Request, options: GuardOptions): Promise<Response | null> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return Response.json({ error: "يجب إرسال البيانات بصيغة JSON", code: "invalid_content_type" }, { status: 415, headers: noStoreHeaders });
  }

  const maxBodyBytes = options.maxBodyBytes ?? 16_384;
  const declaredSize = Number(request.headers.get("content-length") || 0);
  if (declaredSize > maxBodyBytes) {
    return Response.json({ error: "حجم الطلب أكبر من المسموح", code: "payload_too_large" }, { status: 413, headers: noStoreHeaders });
  }

  const actualSize = new TextEncoder().encode(await request.clone().text()).byteLength;
  if (actualSize > maxBodyBytes) {
    return Response.json({ error: "حجم الطلب أكبر من المسموح", code: "payload_too_large" }, { status: 413, headers: noStoreHeaders });
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "مصدر الطلب غير مسموح", code: "origin_not_allowed" }, { status: 403, headers: noStoreHeaders });
  }

  const now = Date.now();
  const windowMs = options.windowMs ?? 60_000;
  const key = `${new URL(request.url).pathname}:${clientAddress(request)}`;
  const current = rateWindows.get(key);
  const next = !current || current.resetAt <= now ? { count: 1, resetAt: now + windowMs } : { count: current.count + 1, resetAt: current.resetAt };
  rateWindows.set(key, next);
  cleanupExpiredWindows(now);

  if (next.count > options.limit) {
    const retryAfter = Math.max(1, Math.ceil((next.resetAt - now) / 1_000));
    return Response.json(
      { error: "محاولات كثيرة في وقت قصير. حاول مرة أخرى بعد قليل.", code: "rate_limited" },
      { status: 429, headers: { ...noStoreHeaders, "Retry-After": String(retryAfter) } },
    );
  }

  return null;
}

export function publicJson(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(data, { ...init, headers });
}

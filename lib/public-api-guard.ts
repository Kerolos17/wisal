import { getSql } from "@/db";

type GuardOptions = {
  limit: number;
  windowMs?: number;
  maxBodyBytes?: number;
};

const noStoreHeaders = { "Cache-Control": "no-store" };

function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return request.headers.get("cf-connecting-ip")?.trim() || forwarded || "local";
}

async function consumeSharedRateLimit(key: string, windowMs: number) {
  const resetAt = Date.now() + windowMs;
  const results = await getSql()`
    WITH pruned AS (
      DELETE FROM rate_limit_windows
      WHERE reset_at < now() - interval '1 day'
    ), upserted AS (
      INSERT INTO rate_limit_windows AS windows (key, count, reset_at, updated_at)
      VALUES (${key}, 1, to_timestamp(${resetAt} / 1000.0), now())
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN windows.reset_at <= now() THEN 1 ELSE windows.count + 1 END,
        reset_at = CASE WHEN windows.reset_at <= now() THEN to_timestamp(${resetAt} / 1000.0) ELSE windows.reset_at END,
        updated_at = now()
      RETURNING count, extract(epoch FROM reset_at) * 1000 AS reset_at_ms
    )
    SELECT count, reset_at_ms FROM upserted
  `;
  const result = Array.isArray(results)
    ? results[0] as { count?: number | string; reset_at_ms?: number | string } | undefined
    : undefined;
  return { count: Number(result?.count), resetAt: Number(result?.reset_at_ms) };
}

export async function guardSharedRateLimit(key: string, options: Pick<GuardOptions, "limit" | "windowMs">): Promise<Response | null> {
  const windowMs = options.windowMs ?? 60_000;
  let next: { count: number; resetAt: number };
  try {
    next = await consumeSharedRateLimit(key, windowMs);
  } catch (error) {
    const requestId = crypto.randomUUID();
    console.error("shared_rate_limit_unavailable", { requestId, errorName: error instanceof Error ? error.name : "UnknownError" });
    return Response.json({ error: "الخدمة غير متاحة مؤقتًا. حاول مرة أخرى بعد قليل.", requestId }, { status: 503, headers: noStoreHeaders });
  }
  if (next.count > options.limit) {
    const retryAfter = Math.max(1, Math.ceil((next.resetAt - Date.now()) / 1_000));
    return Response.json(
      { error: "محاولات كثيرة في وقت قصير. حاول مرة أخرى بعد قليل.", code: "rate_limited" },
      { status: 429, headers: { ...noStoreHeaders, "Retry-After": String(retryAfter) } },
    );
  }
  return null;
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

  const key = `${new URL(request.url).pathname}:${clientAddress(request)}`;
  return guardSharedRateLimit(key, options);
}

export function publicJson(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(data, { ...init, headers });
}

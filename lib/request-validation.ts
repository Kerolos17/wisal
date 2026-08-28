const JSON_CONTENT_TYPE = "application/json";
const DEFAULT_MAX_JSON_BYTES = 64 * 1024;

export class RequestValidationError extends Error {
  constructor(
    readonly status: 400 | 413 | 415,
    message: string,
    readonly code: "invalid_content_type" | "invalid_json" | "invalid_json_object" | "payload_too_large",
  ) {
    super(message);
    this.name = "RequestValidationError";
  }
}

type ReadJsonOptions = {
  maxBytes?: number;
};

/**
 * Reads one bounded JSON object and turns malformed transport input into a
 * client error instead of letting `request.json()` reach the route handler.
 */
// Routes narrow required fields before they use them; this default keeps the
// shared transport guard usable by the existing narrowly-validated handlers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readJsonBody<T = Record<string, any>>(
  request: Request,
  options: ReadJsonOptions = {},
): Promise<T> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith(JSON_CONTENT_TYPE)) {
    throw new RequestValidationError(415, "يجب إرسال البيانات بصيغة JSON", "invalid_content_type");
  }

  const maxBytes = options.maxBytes ?? DEFAULT_MAX_JSON_BYTES;
  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredSize) && declaredSize > maxBytes) {
    throw new RequestValidationError(413, "حجم الطلب أكبر من المسموح", "payload_too_large");
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    throw new RequestValidationError(413, "حجم الطلب أكبر من المسموح", "payload_too_large");
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new RequestValidationError(400, "بيانات JSON غير صالحة", "invalid_json");
  }
  if (!value || Array.isArray(value) || typeof value !== "object") {
    throw new RequestValidationError(400, "يجب أن تكون بيانات JSON كائنًا", "invalid_json_object");
  }
  return value as T;
}

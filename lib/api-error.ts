type ApiErrorOptions = {
  message: string;
  status?: number;
  publicMessages?: readonly string[];
  messageByCode?: Readonly<Record<string, string>>;
  statusByCode?: Readonly<Record<string, number>>;
};

function isRequestValidationError(error: unknown): error is { status: number; message: string; code: string } {
  return error instanceof Error && error.name === "RequestValidationError" &&
    typeof (error as { status?: unknown }).status === "number" &&
    typeof (error as { code?: unknown }).code === "string";
}

export function apiErrorResponse(error: unknown, options: ApiErrorOptions) {
  if (isRequestValidationError(error)) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  const requestId = crypto.randomUUID();
  const errorName = error instanceof Error ? error.name : "UnknownError";
  const errorCode = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
    ? error.code
    : undefined;
  const rawMessage = error instanceof Error ? error.message : "";
  const publicMessage = (errorCode && options.messageByCode?.[errorCode])
    || (options.publicMessages?.includes(rawMessage) ? rawMessage : options.message);
  const status = (errorCode && options.statusByCode?.[errorCode]) || options.status || 500;

  console.error("api_request_failed", { requestId, errorName, errorCode });
  return Response.json(
    { error: publicMessage, requestId },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

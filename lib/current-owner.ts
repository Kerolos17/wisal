import { getPlatformIdentity } from "@/lib/auth/identity";

export async function getCurrentOwnerEmail() {
  const user = await getPlatformIdentity();
  if (!user?.email) throw new Error("Authentication required");
  return user.email.toLowerCase();
}

export function ownerApiError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const code = (error as { code?: string } | null)?.code;
  const status = (error as { status?: unknown } | null)?.status;
  if (error instanceof Error && error.name === "RequestValidationError" && typeof status === "number") {
    return Response.json({ error: message, code }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
  if (message === "Authentication required") return Response.json({ error: message }, { status: 401 });
  if (code === "FORBIDDEN") return Response.json({ error: message }, { status: 403 });
  if (code === "CONFLICT") return Response.json({ error: message }, { status: 409 });
  return Response.json({ error: message }, { status: 500 });
}

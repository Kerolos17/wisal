import { getPlatformIdentity } from "@/lib/auth/identity";

export async function getCurrentOwnerEmail() {
  const user = await getPlatformIdentity();
  if (!user?.email) throw new Error("Authentication required");
  return user.email.toLowerCase();
}

export function ownerApiError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const code = (error as { code?: string } | null)?.code;
  if (message === "Authentication required") return Response.json({ error: message }, { status: 401 });
  if (code === "FORBIDDEN") return Response.json({ error: message }, { status: 403 });
  if (code === "CONFLICT") return Response.json({ error: message }, { status: 409 });
  return Response.json({ error: message }, { status: 500 });
}

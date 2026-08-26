import { getPlatformIdentity } from "@/lib/auth/identity";

export async function getCurrentOwnerEmail() {
  const user = await getPlatformIdentity();
  if (!user?.email) throw new Error("Authentication required");
  return user.email.toLowerCase();
}

export function ownerApiError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  return Response.json({ error: message }, { status: message === "Authentication required" ? 401 : 500 });
}

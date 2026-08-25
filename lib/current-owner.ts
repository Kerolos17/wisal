import { getPlatformIdentity } from "@/lib/auth/identity";

export async function getCurrentOwnerEmail() {
  const user = await getPlatformIdentity();
  if (!user?.email) throw new Error("Authentication required");
  return user.email.toLowerCase();
}

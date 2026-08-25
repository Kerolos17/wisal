import { getPlatformIdentity } from "@/lib/auth/identity";
import { ensureAccount } from "@/lib/account-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getPlatformIdentity();
  if (!user) return Response.json({ signedIn: false, displayName: null, email: null, role: null }, { status: 401 });
  const account = await ensureAccount(user);
  return Response.json({
    signedIn: true,
    displayName: account.displayName,
    email: account.email,
    role: account.role,
  });
}

import Home from "@/app/page";
import { requirePlatformIdentity } from "@/lib/auth/identity";
import { ensureAccount } from "@/lib/account-data";
import { isPlatformOwner, isPlatformOwnerConfigured } from "@/lib/platform-owner";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const identity = await requirePlatformIdentity("/admin");
  const account = await ensureAccount(identity);
  if (!["admin", "support", "content_manager"].includes(account.role)) {
    return <main className="access-denied"><span>!</span><h1>Access denied</h1><p>This area is available only to the Wisal administration team.</p><a href="/workspace">Back to event dashboard</a></main>;
  }
  const isOwner = isPlatformOwnerConfigured() && isPlatformOwner(account.email);
  return <Home initialView="admin" authenticated account={account} isOwner={isOwner} canManagePayments={account.role === "admin"} />;
}

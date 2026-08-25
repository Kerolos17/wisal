import Home from "@/app/page";
import { requirePlatformIdentity } from "@/lib/auth/identity";
import { ensureAccount } from "@/lib/account-data";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const identity = await requirePlatformIdentity("/workspace");
  const account = await ensureAccount(identity);
  return <Home initialView="dashboard" authenticated account={account} />;
}

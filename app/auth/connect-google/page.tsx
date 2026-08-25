import { redirect } from "next/navigation";
import { safeReturnPath } from "@/lib/auth/identity";
import { isNeonAuthEnabled } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function ConnectGooglePage({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string }> }) {
  const params = await searchParams;
  const returnTo = safeReturnPath(params.returnTo || "/workspace");
  if (!isNeonAuthEnabled()) redirect(returnTo);
  redirect(returnTo);
}

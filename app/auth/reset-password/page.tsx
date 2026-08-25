import { redirect } from "next/navigation";
import PasswordRecoveryCard from "@/app/auth/password-recovery-card";
import { safeReturnPath } from "@/lib/auth/identity";
import { isNeonAuthEnabled } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; token?: string; error?: string }> }) {
  const params = await searchParams;
  const returnTo = safeReturnPath(params.returnTo || "/workspace");
  if (!isNeonAuthEnabled()) redirect(`/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
  return <PasswordRecoveryCard mode="reset" returnTo={returnTo} token={params.token || ""} invalidToken={!params.token || Boolean(params.error)} />;
}

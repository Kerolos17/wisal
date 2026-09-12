import { redirect } from "next/navigation";
import ConnectGoogleCard from "./connect-google-card";
import { requirePlatformIdentity, safeReturnPath } from "@/lib/auth/identity";
import { isNeonAuthEnabled } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function ConnectGooglePage({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string }> }) {
  const params = await searchParams;
  const returnTo = safeReturnPath(params.returnTo || "/workspace");
  if (!isNeonAuthEnabled()) redirect(returnTo);
  const connectPath = `/auth/connect-google?returnTo=${encodeURIComponent(returnTo)}`;
  const identity = await requirePlatformIdentity(connectPath);
  const initialError = params.error
    ? "Google could not be connected. Your existing Wisal account was left unchanged. Please try again."
    : "";
  return <ConnectGoogleCard returnTo={returnTo} email={identity.email} initialError={initialError} />;
}

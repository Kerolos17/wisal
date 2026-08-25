import { redirect } from "next/navigation";
import AuthForm from "@/app/auth/auth-form";
import { chatGPTSignInPath } from "@/app/chatgpt-auth";
import { isNeonAuthEnabled } from "@/lib/auth/server";
import { safeReturnPath } from "@/lib/auth/identity";

export const dynamic = "force-dynamic";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const params = await searchParams;
  const returnTo = safeReturnPath(params.returnTo || "/workspace");
  if (!isNeonAuthEnabled()) redirect(chatGPTSignInPath(returnTo));
  return <AuthForm mode="sign-up" returnTo={returnTo} />;
}

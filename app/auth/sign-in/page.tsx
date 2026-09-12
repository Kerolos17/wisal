import { redirect } from "next/navigation";
import AuthForm from "@/app/auth/auth-form";
import { chatGPTSignInPath } from "@/app/chatgpt-auth";
import { isNeonAuthEnabled } from "@/lib/auth/server";
import { safeReturnPath } from "@/lib/auth/identity";

export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string; reset?: string }> }) {
  const params = await searchParams;
  const returnTo = safeReturnPath(params.returnTo || "/workspace");
  if (!isNeonAuthEnabled()) redirect(chatGPTSignInPath(returnTo));
  const initialError = params.reset === "success"
    ? "Your password has been updated. Sign in with your new password."
    : params.error === "account_not_linked"
    ? "This email already uses password sign-in. Sign in with your password first, then connect Google from the secure account-linking page."
    : params.error
      ? "Google sign-in could not be completed. Please try again or use your email and password."
      : "";
  return <AuthForm mode="sign-in" returnTo={returnTo} initialError={initialError} accountLinkingNeeded={params.error === "account_not_linked"} />;
}

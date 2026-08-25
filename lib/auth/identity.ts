import { redirect } from "next/navigation";
import { chatGPTSignInPath, getChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import { getNeonAuth, isNeonAuthEnabled } from "@/lib/auth/server";

export type PlatformIdentity = ChatGPTUser;

function safeReturnPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://wisal.local");
    return url.origin === "https://wisal.local" ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch {
    return "/";
  }
}

export async function getPlatformIdentity(): Promise<PlatformIdentity | null> {
  if (!isNeonAuthEnabled()) return getChatGPTUser();

  try {
    const { data } = await getNeonAuth().getSession();
    const user = data?.user;
    if (!user?.email) return null;
    const name = user.name?.trim() || user.email;
    return { displayName: name, email: user.email, fullName: name };
  } catch {
    return null;
  }
}

export async function requirePlatformIdentity(returnTo: string): Promise<PlatformIdentity> {
  const identity = await getPlatformIdentity();
  if (identity) return identity;
  const safe = safeReturnPath(returnTo);
  redirect(isNeonAuthEnabled() ? `/auth/sign-in?returnTo=${encodeURIComponent(safe)}` : chatGPTSignInPath(safe));
}

export { safeReturnPath };

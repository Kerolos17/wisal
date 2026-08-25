import { NextResponse } from "next/server";
import { chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { getNeonAuth, isNeonAuthEnabled } from "@/lib/auth/server";
import { safeReturnPath } from "@/lib/auth/identity";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = safeReturnPath(url.searchParams.get("returnTo") || "/");
  if (!isNeonAuthEnabled()) return NextResponse.redirect(new URL(chatGPTSignOutPath(returnTo), request.url));
  await getNeonAuth().signOut();
  return NextResponse.redirect(new URL(returnTo, request.url));
}

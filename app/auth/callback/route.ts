import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { safeReturnPath } from "@/lib/auth/identity";

export function GET(request: NextRequest) {
  const returnTo = safeReturnPath(request.nextUrl.searchParams.get("returnTo") || "/workspace");
  return NextResponse.redirect(new URL(returnTo, request.url));
}

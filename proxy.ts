import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getNeonAuth, isNeonAuthEnabled } from "@/lib/auth/server";

export function proxy(request: NextRequest) {
  if (!isNeonAuthEnabled()) return NextResponse.next();
  return getNeonAuth().middleware({ loginUrl: "/auth/sign-in" })(request);
}

export const config = {
  matcher: ["/auth/callback"],
};

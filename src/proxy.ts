import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Next.js 16 "proxy" file convention (formerly middleware.ts).
// Authoritative auth gate. getSessionCookie() only checks for cookie PRESENCE
// (no DB hit) — fast enough for the edge. Real session validation happens per
// request via auth.api.getSession() in route handlers / layouts.
export function proxy(req: NextRequest) {
  const session = getSessionCookie(req);
  const { pathname } = req.nextUrl;

  const isAuthedRoute = pathname.startsWith("/app");
  const isAuthPage = pathname === "/login";

  if (!session && isAuthedRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/app/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};

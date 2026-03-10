import { NextRequest, NextResponse } from "next/server";

/**
 * Decode a JWT payload without signature verification.
 * The server enforces validity; we only need the role claim for routing.
 * Uses atob — available in Edge Runtime (Node 16+).
 */
function decodeRole(token: string): string | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { role?: string; exp?: number };
    // Treat expired tokens as unauthenticated
    if (payload.exp != null && payload.exp * 1000 < Date.now()) return null;
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("arep_token")?.value;

  const isAdminPath = pathname.startsWith("/admin");
  const isConsultantPath = pathname.startsWith("/consultant");

  // Only intercept protected routes
  if (!isAdminPath && !isConsultantPath) {
    return NextResponse.next();
  }

  // No token → redirect to /login preserving the original path
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = decodeRole(token);

  // Expired / malformed token
  if (!role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPath && role !== "ADMIN") {
    // CONSULTANT trying to hit /admin → their dashboard
    if (role === "CONSULTANT") {
      return NextResponse.redirect(
        new URL("/consultant/listings", request.url),
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isConsultantPath && role !== "CONSULTANT") {
    // ADMIN trying to hit /consultant → their dashboard
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/moderation", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/consultant/:path*"],
};

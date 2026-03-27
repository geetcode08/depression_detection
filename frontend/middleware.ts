import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/chat", "/dashboard", "/analysis", "/consent"];

type JwtPayload = {
  exp?: number;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payloadPart = parts[1];
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as JwtPayload;
    return payload;
  } catch {
    return null;
  }
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value ?? null;

  let hasValidJwt = false;
  if (token) {
    const payload = decodeJwtPayload(token);
    const exp = payload?.exp;

    if (typeof exp === "number") {
      const now = Math.floor(Date.now() / 1000);
      if (exp <= now) {
        const redirectUrl = new URL("/login?expired=true", request.url);
        const response = NextResponse.redirect(redirectUrl);
        response.cookies.delete("access_token");
        return response;
      }
      hasValidJwt = true;
    }
  }

  if (!hasValidJwt && isProtectedPath(pathname)) {
    const originalPath = `${pathname}${search ?? ""}`;
    const loginUrl = new URL(`/login?next=${encodeURIComponent(originalPath)}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/consent", "/chat/:path*", "/dashboard/:path*", "/analysis/:path*"],
};

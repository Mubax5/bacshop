import { NextRequest, NextResponse } from "next/server";
import { cookieName, issueCsrfToken, verifyCsrfToken } from "@/infrastructure/security/csrf";

const protectedPrefixes = ["/account", "/reseller", "/admin"];

export async function middleware(request: NextRequest) {
  const production = process.env.NODE_ENV === "production";
  const pathname = request.nextUrl.pathname;
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isProtectedPage = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) && !pathname.startsWith("/api/");
  const sessionCookie = isAdminPath
    ? production ? "__Host-bacshop-admin-session" : "bacshop-admin-session"
    : production ? "__Host-bacshop-session" : "bacshop-session";
  if (!request.cookies.get(sessionCookie) && isProtectedPage) {
    const url = new URL("/auth/sign-in", process.env.APP_ORIGIN ?? request.url);
    url.search = `?returnTo=${encodeURIComponent(`${pathname}${request.nextUrl.search}`)}`;
    return NextResponse.redirect(url);
  }

  const databaseRuntime = process.env.BACSHOP_RUNTIME === "database" || (process.env.BACSHOP_RUNTIME === undefined && production);
  const csrfSecret = databaseRuntime
    ? process.env.SESSION_SECRET
    : undefined;
  const name = cookieName(production);
  const existing = request.cookies.get(name)?.value;
  const valid = existing ? await verifyCsrfToken(existing, csrfSecret) : false;
  const token = valid ? existing : (csrfSecret || !production ? await issueCsrfToken(csrfSecret) : undefined);
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.delete("x-bacshop-csrf");
  if (token) forwardedHeaders.set("x-bacshop-csrf", token);
  const response = NextResponse.next({ request: { headers: forwardedHeaders } });
  if (token && (!valid || !existing)) {
    response.cookies.set(name, token, { httpOnly: true, sameSite: "lax", secure: production, path: "/", ...(production ? {} : { maxAge: 60 * 60 }) });
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };

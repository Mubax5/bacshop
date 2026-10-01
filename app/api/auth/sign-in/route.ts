import { NextResponse } from "next/server";
import { getConfig } from "@/infrastructure/config/env";
import { validateCsrfRequest } from "@/infrastructure/security/csrf";
import { developmentAuthAdapter, sessionCookieName } from "@/application/auth/require-customer";
import { getIdentityService, usesDatabaseIdentity } from "@/application/auth/identity";
import { validateReturnPath } from "@/application/auth/return-path";
import { consumeAuthRateLimit } from "@/application/auth/rate-limit";

function redirectTo(config: ReturnType<typeof getConfig>, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, config.appOrigin), 303);
}

function setSession(response: NextResponse, token: string, kind: "customer" | "admin", expiresAt?: Date): void {
  const config = getConfig();
  const maxAge = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)) : kind === "admin" ? config.auth.adminSessionTtlSeconds : config.auth.sessionTtlSeconds;
  response.cookies.set(sessionCookieName(kind), token, { httpOnly: true, sameSite: "lax", secure: config.isProduction, path: "/", maxAge });
  response.cookies.delete(sessionCookieName(kind === "admin" ? "customer" : "admin"));
}

export async function POST(request: Request) {
  const form = await request.formData();
  const config = getConfig();
  if (!(await validateCsrfRequest(request, String(form.get("csrf") ?? ""), { trustedOrigins: config.trustedOrigins, secret: config.runtime === "database" ? process.env.SESSION_SECRET ?? config.auth.sessionSecret : undefined, isProduction: config.isProduction }))) return redirectTo(config, "/auth/sign-in?error=csrf");
  const returnTo = validateReturnPath(String(form.get("returnTo") ?? "/"));
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const rate = await consumeAuthRateLimit(request, "sign-in", email);
  if (rate && !rate.allowed) return new NextResponse("Too many attempts", { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  if (usesDatabaseIdentity()) {
    const admin = returnTo === "/admin" || returnTo.startsWith("/admin/");
    const issued = await getIdentityService().authenticate({ email, password, admin });
    if (!issued) return redirectTo(config, `/auth/sign-in?error=invalid&returnTo=${encodeURIComponent(returnTo)}`);
    const kind = issued.kind;
    if (issued.requiresMfaEnrollment) { const response = redirectTo(config, `/auth/mfa/enroll?returnTo=${encodeURIComponent(returnTo)}`); setSession(response, issued.token, kind, issued.expiresAt); return response; }
    if (issued.requiresMfa) { const response = redirectTo(config, `/auth/mfa?returnTo=${encodeURIComponent(returnTo)}`); setSession(response, issued.token, kind, issued.expiresAt); return response; }
    const response = redirectTo(config, returnTo);
    setSession(response, issued.token, kind, issued.expiresAt);
    return response;
  }

  const adminToken = password === "bacshop-admin" && email === "admin@bacshop.test" ? "dev-admin-super"
    : password === "bacshop-admin" && email === "operations@bacshop.test" ? "dev-admin-operations"
      : password === "bacshop-admin" && email === "finance@bacshop.test" ? "dev-admin-finance"
        : password === "bacshop-admin" && email === "content@bacshop.test" ? "dev-admin-content" : null;
  const session = await developmentAuthAdapter.authenticate(email, password);
  if (!session && !adminToken) return redirectTo(config, `/auth/sign-in?error=invalid&returnTo=${encodeURIComponent(returnTo)}`);
  const response = redirectTo(config, returnTo);
  setSession(response, adminToken ?? (session?.role === "reseller-approved" ? "dev-reseller-approved" : session?.userId === "customer-demo-1" ? "dev-customer-session" : `dev-session:${session?.userId}`), adminToken ? "admin" : "customer");
  return response;
}

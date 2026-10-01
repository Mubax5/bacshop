import { NextResponse } from "next/server";
import { getConfig } from "@/infrastructure/config/env";
import { validateCsrfRequest } from "@/infrastructure/security/csrf";
import { getIdentityService, getSessionToken, usesDatabaseIdentity } from "@/application/auth/identity";
import { sessionCookieName } from "@/application/auth/require-customer";
import { validateReturnPath } from "@/application/auth/return-path";
import { consumeAuthRateLimit } from "@/application/auth/rate-limit";

export async function POST(request: Request) {
  const form = await request.formData();
  const config = getConfig();
  if (!(await validateCsrfRequest(request, String(form.get("csrf") ?? ""), { trustedOrigins: config.trustedOrigins, secret: config.runtime === "database" ? process.env.SESSION_SECRET ?? config.auth.sessionSecret : undefined, isProduction: config.isProduction }))) return new NextResponse("Invalid request", { status: 403 });
  if (!usesDatabaseIdentity()) return new NextResponse("Unavailable", { status: 404 });
  const token = await getSessionToken("admin");
  const rate = await consumeAuthRateLimit(request, "mfa", undefined, token);
  if (rate && !rate.allowed) return new NextResponse("Too many attempts", { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const input = String(form.get("code") ?? "").trim() || String(form.get("recoveryCode") ?? "").trim();
  const completed = token ? await getIdentityService().completeMfa(token, input) : null;
  if (!completed) return NextResponse.redirect(new URL(`/auth/mfa?error=invalid&returnTo=${encodeURIComponent(validateReturnPath(String(form.get("returnTo") ?? "/admin"), "/admin"))}`, config.appOrigin), 303);
  const response = NextResponse.redirect(new URL(validateReturnPath(String(form.get("returnTo") ?? "/admin"), "/admin"), config.appOrigin), 303);
  response.cookies.set(sessionCookieName("admin"), completed.token, { httpOnly: true, sameSite: "lax", secure: config.isProduction, path: "/", maxAge: config.auth.adminSessionTtlSeconds });
  return response;
}

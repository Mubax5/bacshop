import { NextResponse } from "next/server";
import { getConfig } from "@/infrastructure/config/env";
import { validateCsrfRequest } from "@/infrastructure/security/csrf";
import { getIdentityService, getSessionToken, usesDatabaseIdentity } from "@/application/auth/identity";
import { validateReturnPath } from "@/application/auth/return-path";
import { consumeAuthRateLimit } from "@/application/auth/rate-limit";

export async function POST(request: Request) {
  const form = await request.formData();
  const config = getConfig();
  if (!(await validateCsrfRequest(request, String(form.get("csrf") ?? ""), { trustedOrigins: config.trustedOrigins, secret: config.runtime === "database" ? process.env.SESSION_SECRET ?? config.auth.sessionSecret : undefined, isProduction: config.isProduction }))) return new NextResponse("Invalid request", { status: 403 });
  if (!usesDatabaseIdentity()) return new NextResponse("Unavailable", { status: 404 });
  const token = await getSessionToken("admin");
  const rate = await consumeAuthRateLimit(request, "reauth", undefined, token);
  if (rate && !rate.allowed) return new NextResponse("Too many attempts", { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const ok = token ? await getIdentityService().reauthenticate(token, String(form.get("password") ?? ""), String(form.get("code") ?? "")) : false;
  const returnTo = validateReturnPath(String(form.get("returnTo") ?? "/admin"), "/admin");
  return NextResponse.redirect(new URL(ok ? returnTo : `/auth/reauth?error=invalid&returnTo=${encodeURIComponent(returnTo)}`, config.appOrigin), 303);
}

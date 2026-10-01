import { NextResponse } from "next/server";
import { getConfig } from "@/infrastructure/config/env";
import { validateCsrfRequest } from "@/infrastructure/security/csrf";
import { developmentAuthAdapter, sessionCookieName } from "@/application/auth/require-customer";
import { getIdentityService, usesDatabaseIdentity } from "@/application/auth/identity";
import { validateReturnPath } from "@/application/auth/return-path";
import { createEmailDelivery } from "@/infrastructure/email/email-delivery";
import { consumeAuthRateLimit } from "@/application/auth/rate-limit";

function setSession(response: NextResponse, token: string): void {
  const config = getConfig();
  response.cookies.set(sessionCookieName("customer"), token, { httpOnly: true, sameSite: "lax", secure: config.isProduction, path: "/", maxAge: config.auth.sessionTtlSeconds });
  response.cookies.delete(sessionCookieName("admin"));
}

export async function POST(request: Request) {
  const form = await request.formData();
  const config = getConfig();
  if (!(await validateCsrfRequest(request, String(form.get("csrf") ?? ""), { trustedOrigins: config.trustedOrigins, secret: config.runtime === "database" ? process.env.SESSION_SECRET ?? config.auth.sessionSecret : undefined, isProduction: config.isProduction }))) return NextResponse.redirect(new URL("/auth/register?error=csrf", config.appOrigin), 303);
  const returnTo = validateReturnPath(String(form.get("returnTo") ?? "/"));
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const displayName = String(form.get("displayName") ?? "").trim() || undefined;
  const rate = await consumeAuthRateLimit(request, "register", email);
  if (rate && !rate.allowed) return new NextResponse("Too many attempts", { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  if (usesDatabaseIdentity()) {
    const result = await getIdentityService().register({ email, password, ...(displayName ? { displayName } : {}) });
    if (!result) return NextResponse.redirect(new URL(`/auth/register?error=invalid&returnTo=${encodeURIComponent(returnTo)}`, config.appOrigin), 303);
    if (!result.session) {
      if (!result.verification) return NextResponse.redirect(new URL(`/auth/sign-in?verification=sent&returnTo=${encodeURIComponent(returnTo)}`, config.appOrigin), 303);
      try {
        await createEmailDelivery(config).sendVerification(result.verification.email, result.verification.token);
      } catch {
        return NextResponse.redirect(new URL(`/auth/register?error=email-unavailable&returnTo=${encodeURIComponent(returnTo)}`, config.appOrigin), 303);
      }
      return NextResponse.redirect(new URL(`/auth/sign-in?verification=sent&returnTo=${encodeURIComponent(returnTo)}`, config.appOrigin), 303);
    }
    const response = NextResponse.redirect(new URL(returnTo, config.appOrigin), 303);
    setSession(response, result.session.token);
    return response;
  }

  const session = await developmentAuthAdapter.register(email, password);
  if (!session) return NextResponse.redirect(new URL(`/auth/register?error=invalid&returnTo=${encodeURIComponent(returnTo)}`, config.appOrigin), 303);
  const response = NextResponse.redirect(new URL(returnTo, config.appOrigin), 303);
  setSession(response, `dev-session:${session.userId}`);
  return response;
}

import { NextResponse } from "next/server";
import { getConfig } from "@/infrastructure/config/env";
import { validateCsrfRequest } from "@/infrastructure/security/csrf";
import { csrfSecret } from "@/application/auth/csrf";
import { consumeAuthRateLimit } from "@/application/auth/rate-limit";
import { getIdentityService, usesDatabaseIdentity } from "@/application/auth/identity";
import { createEmailDelivery } from "@/infrastructure/email/email-delivery";

export async function POST(request: Request) {
  const form = await request.formData();
  const config = getConfig();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!(await validateCsrfRequest(request, String(form.get("csrf") ?? ""), { trustedOrigins: config.trustedOrigins, secret: csrfSecret(), isProduction: config.isProduction }))) return new NextResponse("Invalid request", { status: 403 });
  const rate = await consumeAuthRateLimit(request, "request-verification", email);
  if (rate && !rate.allowed) return new NextResponse("Too many attempts", { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (usesDatabaseIdentity()) {
    if (!config.email.enabled || !config.email.smtp) return NextResponse.redirect(new URL("/auth/verify?error=email-unavailable", config.appOrigin), 303);
    const verification = await getIdentityService().requestVerification(email);
    if (verification) {
      try {
        await createEmailDelivery(config).sendVerification(verification.email, verification.token);
      } catch {
        return NextResponse.redirect(new URL("/auth/verify?error=email-unavailable", config.appOrigin), 303);
      }
    }
  }
  return NextResponse.redirect(new URL("/auth/verify?sent=1", config.appOrigin), 303);
}

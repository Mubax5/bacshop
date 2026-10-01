import { NextResponse } from "next/server";
import { getConfig } from "@/infrastructure/config/env";
import { validateCsrfRequest } from "@/infrastructure/security/csrf";
import { getIdentityService, usesDatabaseIdentity } from "@/application/auth/identity";
import { csrfSecret } from "@/application/auth/csrf";
import { consumeAuthRateLimit } from "@/application/auth/rate-limit";
export async function POST(request: Request) { const form = await request.formData(); const config = getConfig(); if (!(await validateCsrfRequest(request, String(form.get("csrf") ?? ""), { trustedOrigins: config.trustedOrigins, secret: csrfSecret(), isProduction: config.isProduction }))) return new NextResponse("Invalid request", { status: 403 }); const rate = await consumeAuthRateLimit(request, "reset-password"); if (rate && !rate.allowed) return new NextResponse("Too many attempts", { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }); const ok = usesDatabaseIdentity() && await getIdentityService().resetPassword(String(form.get("token") ?? ""), String(form.get("password") ?? "")); return NextResponse.redirect(new URL(ok ? "/auth/sign-in?reset=1" : "/auth/reset-password?error=invalid", config.appOrigin), 303); }

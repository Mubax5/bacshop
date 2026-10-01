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
  const rate = await consumeAuthRateLimit(request, "mfa-enroll", undefined, token);
  if (rate && !rate.allowed) return new NextResponse("Too many attempts", { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const completed = token ? await getIdentityService().completeMfa(token, String(form.get("code") ?? "").trim()) : null;
  if (!completed) return NextResponse.redirect(new URL(`/auth/mfa/enroll?error=invalid&returnTo=${encodeURIComponent(validateReturnPath(String(form.get("returnTo") ?? "/admin"), "/admin"))}`, config.appOrigin), 303);
  const returnTo = validateReturnPath(String(form.get("returnTo") ?? "/admin"), "/admin");
  const response = completed.recoveryCodes?.length
    ? new NextResponse(`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Kode pemulihan Bacshop</title></head><body><main><h1>Simpan kode pemulihan</h1><p>Kode ini hanya ditampilkan sekali. Simpan di tempat aman sebelum melanjutkan.</p><ul>${completed.recoveryCodes.map((code) => `<li><code>${escapeHtml(code)}</code></li>`).join("")}</ul><p><a href="${escapeHtml(returnTo)}">Lanjutkan ke admin</a></p></main></body></html>`, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store, private" } })
    : NextResponse.redirect(new URL(returnTo, config.appOrigin), 303);
  response.cookies.set(sessionCookieName("admin"), completed.token, { httpOnly: true, sameSite: "lax", secure: config.isProduction, path: "/", maxAge: config.auth.adminSessionTtlSeconds });
  return response;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

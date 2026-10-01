import { redirect } from "next/navigation";
import { getConfig } from "@/infrastructure/config/env";
import { validateCsrfRequest } from "@/infrastructure/security/csrf";
import { getIdentityService, getSessionToken, usesDatabaseIdentity } from "@/application/auth/identity";
import { csrfSecret } from "@/application/auth/csrf";
import { consumeAuthRateLimit } from "@/application/auth/rate-limit";
export async function POST(request: Request) { const form = await request.formData(); const config = getConfig(); if (!(await validateCsrfRequest(request, String(form.get("csrf") ?? ""), { trustedOrigins: config.trustedOrigins, secret: csrfSecret(), isProduction: config.isProduction }))) redirect("/account/security?error=csrf"); const token = await getSessionToken(); const rate = await consumeAuthRateLimit(request, "change-password", undefined, token); if (rate && !rate.allowed) redirect("/account/security?error=rate-limit"); const ok = usesDatabaseIdentity() && token ? await getIdentityService().changePassword(token, String(form.get("currentPassword") ?? ""), String(form.get("newPassword") ?? "")) : false; redirect(ok ? "/auth/sign-in?changed=1" : "/account/security?error=invalid"); }

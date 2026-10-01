import { redirect } from "next/navigation";
import { getConfig } from "@/infrastructure/config/env";
import { validateCsrfRequest } from "@/infrastructure/security/csrf";
import { getIdentityService, getSessionToken, usesDatabaseIdentity } from "@/application/auth/identity";
import { csrfSecret } from "@/application/auth/csrf";
export async function POST(request: Request) { const form = await request.formData(); const config = getConfig(); if (!(await validateCsrfRequest(request, String(form.get("csrf") ?? ""), { trustedOrigins: config.trustedOrigins, secret: csrfSecret(), isProduction: config.isProduction }))) redirect("/account/profile?error=csrf"); const token = await getSessionToken(); const result = usesDatabaseIdentity() && token ? await getIdentityService().updateProfile(token, { displayName: String(form.get("displayName") ?? "") }) : null; redirect(result ? "/account/profile?saved=1" : "/account/profile?error=invalid"); }

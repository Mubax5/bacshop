import { getConfig } from "@/infrastructure/config/env";
import { validateCsrfRequest } from "@/infrastructure/security/csrf";
import { csrfSecret } from "@/application/auth/csrf";

export async function validAdminMutation(request: Request, form: FormData): Promise<boolean> {
  const config = getConfig();
  return validateCsrfRequest(request, String(form.get("csrf") ?? ""), { trustedOrigins: config.trustedOrigins, secret: csrfSecret(), isProduction: config.isProduction });
}

export function productionAdminOperationsUnavailable(): boolean {
  return getConfig().runtime === "database";
}

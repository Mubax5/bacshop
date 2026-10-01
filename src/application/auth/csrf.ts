import { cookies, headers } from "next/headers";
import { getConfig } from "@/infrastructure/config/env";
import { cookieName, issueCsrfToken, verifyCsrfToken } from "@/infrastructure/security/csrf";

export function csrfSecret(): string | undefined {
  const config = getConfig();
  if (config.runtime !== "database") return undefined;
  return process.env.SESSION_SECRET ?? config.auth.sessionSecret;
}

export async function csrfFormToken(): Promise<string> {
  const config = getConfig();
  const requestToken = (await headers()).get("x-bacshop-csrf");
  if (requestToken) return requestToken;
  const existing = (await cookies()).get(cookieName(config.isProduction))?.value;
  const secret = csrfSecret();
  if (existing && await verifyCsrfToken(existing, secret)) return existing;
  return issueCsrfToken(secret);
}

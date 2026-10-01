import { NextResponse } from "next/server";
import { getConfig } from "@/infrastructure/config/env";
import { validateCsrfRequest } from "@/infrastructure/security/csrf";
import { getIdentityService, usesDatabaseIdentity } from "@/application/auth/identity";
import { sessionCookieName } from "@/application/auth/require-customer";

export async function POST(request: Request) {
  const form = await request.formData();
  const config = getConfig();
  if (!(await validateCsrfRequest(request, String(form.get("csrf") ?? ""), { trustedOrigins: config.trustedOrigins, secret: config.runtime === "database" ? process.env.SESSION_SECRET ?? config.auth.sessionSecret : undefined, isProduction: config.isProduction }))) return new NextResponse("Invalid request", { status: 403 });
  const cookies = request.headers.get("cookie") ?? "";
  const tokens = (["customer", "admin"] as const).map((kind) => ({ kind, token: cookies.match(new RegExp(`(?:^|;\\s*)${sessionCookieName(kind)}=([^;]+)`))?.[1] })).filter((entry): entry is { kind: "customer" | "admin"; token: string } => Boolean(entry.token));
  if (usesDatabaseIdentity()) for (const entry of tokens) await getIdentityService().logout(entry.token);
  const response = NextResponse.redirect(new URL("/", config.appOrigin), 303);
  response.cookies.delete(sessionCookieName("customer"));
  response.cookies.delete(sessionCookieName("admin"));
  return response;
}

import { NextResponse } from "next/server";
import { developmentAuthAdapter, SESSION_COOKIE } from "@/application/auth/require-customer";
import { validateReturnPath } from "@/application/auth/return-path";

export async function POST(request: Request) {
  if (String(process.env.NODE_ENV) === "production") return new NextResponse("Authentication provider is not configured", { status: 503 });
  const form = await request.formData();
  const returnTo = validateReturnPath(String(form.get("returnTo") ?? "/account"));
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const adminToken = password === "bacshop-admin" && email === "admin@bacshop.test" ? "dev-admin-super"
    : password === "bacshop-admin" && email === "operations@bacshop.test" ? "dev-admin-operations"
      : password === "bacshop-admin" && email === "finance@bacshop.test" ? "dev-admin-finance"
        : password === "bacshop-admin" && email === "content@bacshop.test" ? "dev-admin-content" : null;
  const session = await developmentAuthAdapter.authenticate(email, password);
  if (!session && !adminToken) return NextResponse.redirect(new URL(`/auth/sign-in?error=invalid&returnTo=${encodeURIComponent(returnTo)}`, request.url), 303);
  const response = NextResponse.redirect(new URL(returnTo, request.url), 303);
  const token = adminToken ?? (session?.role === "reseller-approved" ? "dev-reseller-approved" : session?.userId === "customer-demo-1" ? "dev-customer-session" : `dev-session:${session?.userId}`);
  response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return response;
}

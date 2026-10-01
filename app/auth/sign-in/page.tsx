import type { Metadata } from "next";
import { SignInSurface } from "@/ui/retail/retail-surfaces";
import { validateReturnPath } from "@/application/auth/return-path";
import { csrfFormToken } from "@/application/auth/csrf";
import { getConfig } from "@/infrastructure/config/env";

export const metadata: Metadata = { title: "Masuk" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string }> }) {
  const params = await searchParams;
  const message = params.error === "csrf" ? "Permintaan kedaluwarsa. Muat ulang halaman dan coba lagi." : params.error === "email-unavailable" ? "Layanan email sedang tidak tersedia. Coba lagi nanti." : params.error ? "Email atau kata sandi tidak cocok." : "";
  return <SignInSurface returnTo={validateReturnPath(params.returnTo, "/")} csrfToken={await csrfFormToken()} error={message} demoMode={getConfig().runtime === "development"} />;
}

import type { Metadata } from "next";
import { RegisterSurface } from "@/ui/retail/retail-surfaces";
import { validateReturnPath } from "@/application/auth/return-path";
import { csrfFormToken } from "@/application/auth/csrf";

export const metadata: Metadata = { title: "Daftar Customer" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string }> }) {
  const params = await searchParams;
  const message = params.error === "csrf" ? "Permintaan kedaluwarsa. Muat ulang halaman dan coba lagi." : params.error === "email-unavailable" ? "Layanan email sedang tidak tersedia. Coba lagi nanti." : params.error ? "Email sudah terdaftar atau kata sandi belum memenuhi syarat." : "";
  return <RegisterSurface returnTo={validateReturnPath(params.returnTo, "/")} csrfToken={await csrfFormToken()} error={message} />;
}

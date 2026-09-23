import type { Metadata } from "next";
import { RegisterSurface } from "@/ui/retail/retail-surfaces";
import { validateReturnPath } from "@/application/auth/return-path";

export const metadata: Metadata = { title: "Daftar Customer" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string }> }) {
  const params = await searchParams;
  return <RegisterSurface returnTo={validateReturnPath(params.returnTo)} error={params.error ? "Email sudah terdaftar atau kata sandi belum memenuhi syarat." : ""} />;
}

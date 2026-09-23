import type { Metadata } from "next";
import { SignInSurface } from "@/ui/retail/retail-surfaces";
import { validateReturnPath } from "@/application/auth/return-path";

export const metadata: Metadata = { title: "Masuk" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string }> }) {
  const params = await searchParams;
  return <SignInSurface returnTo={validateReturnPath(params.returnTo)} error={params.error ? "Email atau kata sandi tidak cocok." : ""} demoMode={String(process.env.NODE_ENV) !== "production"} />;
}

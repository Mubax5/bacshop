import type { Metadata } from "next";
import "@/ui/foundations/tokens.css";
import "./globals.css";
import { PublicShell } from "@/ui/shells/public-shell";
import { getPlatformSession } from "@/application/auth/require-customer";
import { getResellerIdentity } from "@/application/reseller/require-reseller";
import { csrfFormToken } from "@/application/auth/csrf";
import { CsrfProvider } from "@/ui/security/csrf-input";

export const metadata: Metadata = {
  title: { default: "Bacshop — Produk digital, lebih jelas", template: "%s | Bacshop" },
  description: "Temukan produk digital dengan informasi aktivasi, wilayah, dan harga retail yang jelas.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [session, resellerIdentity] = await Promise.all([getPlatformSession(), getResellerIdentity()]);
  const resellerApproved = resellerIdentity?.status === "approved";
  const state = session?.role === "admin" ? "admin" : session || resellerApproved ? "customer" : "guest";
  return (
    <html lang="id">
      <body><CsrfProvider token={await csrfFormToken()}><PublicShell state={state} resellerApproved={resellerApproved}>{children}</PublicShell></CsrfProvider></body>
    </html>
  );
}

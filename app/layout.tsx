import type { Metadata } from "next";
import "@/ui/foundations/tokens.css";
import "./globals.css";
import { PublicShell } from "@/ui/shells/public-shell";
import { getCustomerSession } from "@/application/auth/require-customer";
import { getResellerIdentity } from "@/application/reseller/require-reseller";

export const metadata: Metadata = {
  title: { default: "Bacshop — Produk digital, lebih jelas", template: "%s | Bacshop" },
  description: "Temukan produk digital dengan informasi aktivasi, wilayah, dan harga retail yang jelas.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [session, resellerIdentity] = await Promise.all([getCustomerSession(), getResellerIdentity()]);
  const resellerApproved = resellerIdentity?.status === "approved";
  return (
    <html lang="id">
      <body><PublicShell state={session || resellerApproved ? "customer" : "guest"} resellerApproved={resellerApproved}>{children}</PublicShell></body>
    </html>
  );
}

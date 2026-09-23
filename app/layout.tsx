import type { Metadata } from "next";
import "@/ui/foundations/tokens.css";
import "./globals.css";
import { PublicShell } from "@/ui/shells/public-shell";
import { getCustomerSession } from "@/application/auth/require-customer";

export const metadata: Metadata = {
  title: { default: "Bacshop — Produk digital, lebih jelas", template: "%s | Bacshop" },
  description: "Temukan produk digital dengan informasi aktivasi, wilayah, dan harga retail yang jelas.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getCustomerSession();
  return (
    <html lang="id">
      <body><PublicShell state={session ? "customer" : "guest"}>{children}</PublicShell></body>
    </html>
  );
}

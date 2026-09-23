import type { Metadata } from "next";
import "@/ui/foundations/tokens.css";
import "./globals.css";
import { PublicShell } from "@/ui/shells/public-shell";

export const metadata: Metadata = {
  title: { default: "Bacshop — Produk digital, lebih jelas", template: "%s | Bacshop" },
  description: "Temukan produk digital dengan informasi aktivasi, wilayah, dan harga retail yang jelas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body><PublicShell>{children}</PublicShell></body>
    </html>
  );
}

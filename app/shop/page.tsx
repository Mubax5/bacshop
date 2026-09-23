import type { Metadata } from "next";
import { getRetailCatalog } from "@/application/catalog/get-retail-catalog";
import { ShopSurface } from "@/ui/commerce/public-pages";

export const metadata: Metadata = { title: "Belanja produk digital" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q = "" }, items] = await Promise.all([searchParams, getRetailCatalog({ kind: "guest" })]);
  return <ShopSurface items={items} query={q} />;
}

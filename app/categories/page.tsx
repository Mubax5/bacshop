import type { Metadata } from "next";
import { getRetailCatalog } from "@/application/catalog/get-retail-catalog";
import { CategoriesSurface } from "@/ui/commerce/public-pages";

export const metadata: Metadata = { title: "Kategori produk digital" };

export default async function CategoriesPage() {
  const items = await getRetailCatalog({ kind: "guest" });
  return <CategoriesSurface items={items} />;
}

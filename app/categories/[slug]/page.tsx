import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRetailCatalog } from "@/application/catalog/get-retail-catalog";
import { CategorySurface } from "@/ui/commerce/public-pages";
import { productsForCategory, publicCategories } from "@/ui/commerce/public-content";

export function generateStaticParams() {
  return publicCategories.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: publicCategories.find((category) => category.slug === slug)?.name ?? "Kategori" };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = publicCategories.find((candidate) => candidate.slug === slug);
  if (!category) notFound();
  const catalog = await getRetailCatalog({ kind: "guest" });
  return <CategorySurface categoryName={category.name} items={productsForCategory(catalog, slug)} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRetailProductDetails } from "@/application/catalog/get-retail-product-details";
import { ProductDetailSurface } from "@/ui/commerce/public-pages";
import { productSlugs } from "@/ui/commerce/public-content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sku = productSlugs[slug];
  const product = sku ? await getRetailProductDetails({ kind: "guest" }, sku) : undefined;
  return { title: product?.productName ?? "Produk digital" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sku = productSlugs[slug];
  if (!sku) notFound();
  const product = await getRetailProductDetails({ kind: "guest" }, sku);
  if (!product) notFound();
  return <ProductDetailSurface product={product} />;
}

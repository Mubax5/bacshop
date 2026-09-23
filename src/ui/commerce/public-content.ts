import type { RetailCatalogItem } from "@/domain/catalog/types";

export interface PublicCategory {
  slug: string;
  name: string;
  description: string;
  symbol: string;
  skus: string[];
}

export const publicCategories: readonly PublicCategory[] = [
  { slug: "ai", name: "AI & Cloud", description: "Alat AI dan layanan cloud", symbol: "AI", skus: ["CLOUD-AI-1M"] },
  { slug: "streaming", name: "Streaming", description: "Hiburan untuk waktu luang", symbol: "▶", skus: ["STREAM-ULT-1M", "MUSIC-FAM-3M"] },
  { slug: "design", name: "Desain", description: "Kreasi visual dan desain", symbol: "◈", skus: ["DESIGN-PRO-1M"] },
  { slug: "productivity", name: "Produktivitas", description: "Aplikasi kerja sehari-hari", symbol: "▤", skus: ["OFFICE-PERSONAL-12M"] },
  { slug: "gaming", name: "Gaming & Gift Card", description: "Saldo dan hiburan digital", symbol: "✦", skus: ["GAME-STORE-500K"] },
];

export const productSlugs: Readonly<Record<string, string>> = {
  "streamplus-ultra-1-bulan": "STREAM-ULT-1M",
  "designcloud-pro-1-bulan": "DESIGN-PRO-1M",
  "melody-premium-family-3-bulan": "MUSIC-FAM-3M",
  "officesuite-personal-12-bulan": "OFFICE-PERSONAL-12M",
  "gamestore-gift-card-500k": "GAME-STORE-500K",
  "cloudai-plus-1-bulan": "CLOUD-AI-1M",
};

export function categoryForSku(sku: string): PublicCategory | undefined {
  return publicCategories.find((category) => category.skus.includes(sku));
}

export function slugForProduct(item: RetailCatalogItem): string {
  return Object.entries(productSlugs).find(([, sku]) => sku === item.sku)?.[0] ?? item.sku.toLowerCase();
}

export function productsForCategory(items: RetailCatalogItem[], slug: string): RetailCatalogItem[] {
  const category = publicCategories.find((candidate) => candidate.slug === slug);
  return category ? items.filter((item) => category.skus.includes(item.sku)) : [];
}

export function formatRetailPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(price);
}

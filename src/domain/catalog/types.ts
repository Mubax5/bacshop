import type { ResellerTier } from "@/domain/access/types";

export type ProductAvailability = "available" | "out-of-stock" | "coming-soon";
export type ActivationMethod = "account-invitation" | "activation-code" | "gift-card";

export interface CatalogSku {
  sku: string;
  productName: string;
  duration: string;
  activationMethod: ActivationMethod;
  region: string;
  requirements: string[];
  sla: string;
  warranty: string;
  support: string;
  stock: number;
  inventoryMode?: "finite" | "unlimited";
  availability: ProductAvailability;
  retailPrice: number;
  resellerPrices: Partial<Record<ResellerTier, number>>;
}

export interface RetailCatalogItem {
  sku: string;
  productName: string;
  duration: string;
  region: string;
  retailPrice: number;
  availability: ProductAvailability;
}

export interface ResellerCatalogItem {
  sku: string;
  productName: string;
  resellerPrice: number;
  retailReferencePrice: number;
}

import { seededCatalog } from "@/infrastructure/catalog/seed-catalog";
import { getRetailCatalog } from "@/application/catalog/get-retail-catalog";
import type { AccessContext } from "@/domain/access/types";

export interface RetailProductDetails {
  sku: string;
  productName: string;
  duration: string;
  region: string;
  retailPrice: number;
  availability: "available" | "out-of-stock" | "coming-soon";
  activationMethod: "account-invitation" | "activation-code" | "gift-card";
  requirements: string[];
  sla: string;
  warranty: string;
  support: string;
}

export async function getRetailProductDetails(
  context: AccessContext,
  sku: string,
): Promise<RetailProductDetails | undefined> {
  const retailItem = (await getRetailCatalog(context)).find((item) => item.sku === sku);
  const seededItem = seededCatalog.find((item) => item.sku === sku);
  if (!retailItem || !seededItem) return undefined;

  return {
    ...retailItem,
    activationMethod: seededItem.activationMethod,
    requirements: [...seededItem.requirements],
    sla: seededItem.sla,
    warranty: seededItem.warranty,
    support: seededItem.support,
  };
}

import { assertAccessContext, type AccessContext } from "@/domain/access/types";
import type { RetailCatalogItem } from "@/domain/catalog/types";
import { developmentCatalogRepository, type CatalogRepository } from "@/infrastructure/catalog/catalog-repository";

export async function getRetailCatalog(
  context: AccessContext | undefined,
  repository: CatalogRepository = developmentCatalogRepository,
): Promise<RetailCatalogItem[]> {
  assertAccessContext(context);
  const skus = await repository.listSkus();
  return skus.map((sku) => ({
    sku: sku.sku,
    productName: sku.productName,
    duration: sku.duration,
    region: sku.region,
    retailPrice: sku.retailPrice,
    availability: sku.availability,
  }));
}

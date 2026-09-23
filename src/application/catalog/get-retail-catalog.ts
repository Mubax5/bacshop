import { assertAccessContext, type AccessContext } from "@/domain/access/types";
import type { RetailCatalogItem } from "@/domain/catalog/types";
import { resolvePrice } from "@/domain/pricing/price-resolver";
import { SeedCatalogRepository } from "@/infrastructure/catalog/catalog-repository";

export async function getRetailCatalog(
  context: AccessContext | undefined,
  repository = new SeedCatalogRepository(),
): Promise<RetailCatalogItem[]> {
  assertAccessContext(context);
  const skus = await repository.listSkus();
  return skus.map((sku) => ({
    sku: sku.sku,
    productName: sku.productName,
    duration: sku.duration,
    region: sku.region,
    retailPrice: resolvePrice(sku, context),
    availability: sku.availability,
  }));
}

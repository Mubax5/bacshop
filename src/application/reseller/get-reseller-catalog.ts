import { assertAccessContext, type AccessContext } from "@/domain/access/types";
import type { ResellerCatalogItem } from "@/domain/catalog/types";
import { resolvePrice } from "@/domain/pricing/price-resolver";
import { developmentCatalogRepository, type CatalogRepository } from "@/infrastructure/catalog/catalog-repository";

export async function getResellerCatalog(
  context: AccessContext | undefined,
  repository: CatalogRepository = developmentCatalogRepository,
): Promise<ResellerCatalogItem[]> {
  assertAccessContext(context);
  if (context.kind !== "reseller-approved" || context.surface !== "reseller-center") {
    throw new Error("Unauthorized reseller catalog access");
  }
  const skus = await repository.listSkus();
  return skus.filter((sku) => sku.resellerPrices[context.tier] !== undefined).map((sku) => ({
    sku: sku.sku,
    productName: sku.productName,
    resellerPrice: resolvePrice(sku, context),
    retailReferencePrice: sku.retailPrice,
  }));
}

import { assertAccessContext, type AccessContext } from "@/domain/access/types";
import type { CatalogSku } from "@/domain/catalog/types";

export function resolvePrice(
  sku: CatalogSku,
  context: AccessContext | undefined,
): number {
  assertAccessContext(context);
  if (context.kind === "reseller-approved" && context.surface === "reseller-center") {
    const price = sku.resellerPrices[context.tier];
    if (price === undefined || !Number.isSafeInteger(price) || price < 0) throw new Error("Reseller price is unavailable for this tier");
    return price;
  }
  return sku.retailPrice;
}

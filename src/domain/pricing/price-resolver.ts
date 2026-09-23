import { assertAccessContext, type AccessContext } from "@/domain/access/types";
import type { CatalogSku } from "@/domain/catalog/types";

export function resolvePrice(
  sku: CatalogSku,
  context: AccessContext | undefined,
): number {
  assertAccessContext(context);
  if (context.kind === "reseller-approved" && context.surface === "reseller-center") {
    return sku.resellerPrices[context.tier];
  }
  return sku.retailPrice;
}

import { describe, expect, it } from "vitest";
import { prepareRetailCheckout } from "@/application/checkout/prepare-retail-checkout";
import { getResellerCatalog } from "@/application/reseller/get-reseller-catalog";
import { SeedCatalogRepository } from "@/infrastructure/catalog/catalog-repository";
import { seededCatalog } from "@/infrastructure/catalog/seed-catalog";
import { resolvePrice } from "@/domain/pricing/price-resolver";

describe("explicit inventory and configured tier prices", () => {
  it("supports unlimited products without inventing a stock count", async () => {
    const sku = { ...seededCatalog[0], stock: 0, inventoryMode: "unlimited" as const };
    const result = await prepareRetailCheckout({ lines: [{ sku: sku.sku, quantity: 2 }], clientTotal: sku.retailPrice * 2, catalog: new SeedCatalogRepository([sku]) });
    expect(result.status).toBe("ready");
    expect(result.lines[0].quantity).toBe(2);
  });

  it("rejects excessive quantity instead of silently replacing it", async () => {
    const sku = { ...seededCatalog[0], stock: 1 };
    const result = await prepareRetailCheckout({ lines: [{ sku: sku.sku, quantity: 2 }], clientTotal: sku.retailPrice, catalog: new SeedCatalogRepository([sku]) });
    expect(result.status).toBe("invalid-input");
  });

  it("does not invent a reseller price for a missing tier", async () => {
    const sku = { ...seededCatalog[0], resellerPrices: {} };
    const context = { kind: "reseller-approved", userId: "reseller-test", tier: "gold", surface: "reseller-center" } as const;
    expect(() => resolvePrice(sku, context)).toThrow("unavailable");
    expect(await getResellerCatalog(context, new SeedCatalogRepository([sku]))).toEqual([]);
    expect(resolvePrice(sku, { ...context, surface: "retail-store" })).toBe(sku.retailPrice);
  });
});

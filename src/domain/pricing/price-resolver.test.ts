import { describe, expect, it } from "vitest";
import { getRetailCatalog } from "@/application/catalog/get-retail-catalog";
import { getResellerCatalog } from "@/application/reseller/get-reseller-catalog";
import { resolveAccessContext } from "@/application/access/resolve-access-context";
import type { AccessContext } from "@/domain/access/types";
import { resolvePrice } from "@/domain/pricing/price-resolver";
import { seededCatalog } from "@/infrastructure/catalog/seed-catalog";

const sku = seededCatalog[0];

describe("protected catalog pricing", () => {
  it("omits reseller price fields entirely from retail catalog payloads", async () => {
    const catalog = await getRetailCatalog({ kind: "guest" });

    expect(catalog.length).toBeGreaterThan(0);
    expect(catalog[0]).toEqual({
      sku: "STREAM-ULT-1M",
      productName: "StreamPlus Ultra",
      duration: "1 bulan",
      region: "Global",
      retailPrice: 89000,
      availability: "available",
    });
    expect("resellerPrice" in catalog[0]).toBe(false);
    expect("resellerPrices" in catalog[0]).toBe(false);
  });

  it("keeps approved reseller-center contexts on retail pricing in the retail catalog", async () => {
    const context: AccessContext = {
      kind: "reseller-approved",
      userId: "reseller-1",
      tier: "silver",
      surface: "reseller-center",
    };

    const catalog = await getRetailCatalog(context);

    expect(catalog[0].retailPrice).toBe(89000);
  });

  it("rejects reseller catalog access for guest, pending, suspended, and retail contexts", async () => {
    const unauthorizedContexts: AccessContext[] = [
      { kind: "guest" },
      { kind: "reseller-pending", userId: "user-1" },
      { kind: "reseller-suspended", userId: "user-1" },
      { kind: "reseller-approved", userId: "user-1", tier: "silver", surface: "retail-store" },
    ];

    for (const context of unauthorizedContexts) {
      await expect(getResellerCatalog(context)).rejects.toThrow(/unauthorized/i);
    }
  });

  it("resolves the approved reseller tier only in explicit reseller-center context", async () => {
    const context = resolveAccessContext(
      { userId: "reseller-1", role: "reseller-approved", resellerTier: "silver" },
      "reseller-center",
    );
    const result = await getResellerCatalog(context);

    expect(result[0]).toEqual({
      sku: "STREAM-ULT-1M",
      productName: "StreamPlus Ultra",
      resellerPrice: 76000,
      retailReferencePrice: 89000,
    });
  });

  it("keeps admin retail reads at retail price and rejects admin reseller pricing", () => {
    const admin: AccessContext = { kind: "admin", userId: "admin-1" };

    expect(resolvePrice(sku, admin)).toBe(89000);
  });

  it("rejects admin reseller-catalog access while preserving admin retail catalog pricing", async () => {
    const admin: AccessContext = { kind: "admin", userId: "admin-1" };

    await expect(getResellerCatalog(admin)).rejects.toThrow(/unauthorized/i);
    const retailCatalog = await getRetailCatalog(admin);
    expect(retailCatalog[0]).toMatchObject({
      sku: sku.sku,
      retailPrice: sku.retailPrice,
    });
  });

  it("rejects absent and invalid access contexts instead of exposing reseller data", () => {
    expect(() => resolvePrice(sku, undefined)).toThrow(/access context/i);
    expect(() => resolvePrice(sku, { kind: "reseller-approved", userId: "r1", tier: "diamond", surface: "reseller-center" } as unknown as AccessContext)).toThrow(/tier/i);
  });
});

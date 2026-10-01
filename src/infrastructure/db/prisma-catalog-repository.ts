import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { CatalogRepository } from "@/infrastructure/catalog/catalog-repository";
import type { ActivationMethod, CatalogSku, ProductAvailability } from "@/domain/catalog/types";
import type { ResellerTier } from "@/domain/access/types";

type CatalogRow = Prisma.SkuGetPayload<{
  include: {
    product: { select: { name: true; isActive: true } };
    inventory: true;
    prices: { include: { resellerTier: { select: { code: true; isActive: true } } } };
  };
}>;

function activationMethod(value: string | null): ActivationMethod {
  switch (value?.trim().toLowerCase()) {
    case "invite":
    case "account-invitation":
    case "account_invitation":
      return "account-invitation";
    case "code":
    case "activation-code":
    case "activation_code":
      return "activation-code";
    case "giftcard":
    case "gift-card":
    case "gift_card":
      return "gift-card";
    default:
      throw new Error("Unsupported activation method for catalog SKU");
  }
}

function requirements(value: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
}

function stockState(row: CatalogRow): { stock: number; availability: ProductAvailability; inventoryMode: "finite" | "unlimited" } {
  const inventory = row.inventory;
  if (!inventory || inventory.availability === "DISCONTINUED") return { stock: 0, availability: "coming-soon", inventoryMode: "finite" };
  if (inventory.availability === "UNLIMITED") return { stock: 0, availability: "available", inventoryMode: "unlimited" };
  if (inventory.availability === "OUT_OF_STOCK") return { stock: 0, availability: "out-of-stock", inventoryMode: "finite" };
  const stock = Math.max(0, inventory.onHand - inventory.reserved - inventory.committed);
  return { stock, availability: stock > 0 ? "available" : "out-of-stock", inventoryMode: "finite" };
}

function mapCatalogRow(row: CatalogRow): CatalogSku {
  const retail = row.prices.find((price) => price.kind === "RETAIL");
  if (!retail || !Number.isSafeInteger(retail.amount) || retail.amount < 0) throw new Error("Effective retail price is unavailable for catalog SKU");
  const resellerPrices: Partial<Record<ResellerTier, number>> = {};
  for (const price of row.prices) {
    if (price.kind !== "RESELLER" || !price.resellerTier?.isActive) continue;
    const code = price.resellerTier.code.trim().toLowerCase();
    if (!["bronze", "silver", "gold"].includes(code)) continue;
    if (!Number.isSafeInteger(price.amount) || price.amount < 0) continue;
    const tier = code as ResellerTier;
    if (resellerPrices[tier] === undefined) resellerPrices[tier] = price.amount;
  }
  const inventory = stockState(row);
  return {
    sku: row.code,
    productName: row.product.name,
    duration: row.durationLabel ?? "",
    activationMethod: activationMethod(row.activationMethod),
    region: row.region ?? "",
    requirements: requirements(row.requirements),
    sla: row.processingSlaText ?? "",
    warranty: row.warrantyTerms ?? "",
    support: row.supportTerms ?? "",
    stock: inventory.stock,
    inventoryMode: inventory.inventoryMode,
    availability: inventory.availability,
    retailPrice: retail.amount,
    resellerPrices,
  };
}

const effectivePriceWhere = (now: Date) => ({
  isActive: true,
  validFrom: { lte: now },
  OR: [{ validUntil: null }, { validUntil: { gt: now } }],
});

/** Durable catalog read adapter. All prices are selected from their effective window. */
export class PrismaCatalogRepository implements CatalogRepository {
  constructor(private readonly database: PrismaClient, private readonly clock: () => Date = () => new Date()) {}

  private queryArgs(now: Date) {
    return {
      where: { isActive: true, product: { isActive: true }, prices: { some: { kind: "RETAIL", ...effectivePriceWhere(now) } } },
      include: {
        product: { select: { name: true, isActive: true } },
        inventory: true,
        prices: { where: effectivePriceWhere(now), orderBy: { validFrom: "desc" }, include: { resellerTier: { select: { code: true, isActive: true } } } },
      },
      orderBy: { code: "asc" },
    } satisfies Prisma.SkuFindManyArgs;
  }

  async listSkus(): Promise<readonly CatalogSku[]> {
    return (await this.database.sku.findMany(this.queryArgs(this.clock()))).map(mapCatalogRow);
  }

  async findSku(sku: string): Promise<CatalogSku | undefined> {
    const args = this.queryArgs(this.clock());
    const row = await this.database.sku.findFirst({ ...args, where: { ...args.where, code: sku } });
    return row ? mapCatalogRow(row) : undefined;
  }
}

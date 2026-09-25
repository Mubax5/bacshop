import type { CatalogSku } from "@/domain/catalog/types";
import { seededCatalog } from "@/infrastructure/catalog/seed-catalog";

/** Adapter seam for a future PostgreSQL catalog repository. */
export interface CatalogRepository {
  listSkus(): Promise<readonly CatalogSku[]>;
  findSku(sku: string): Promise<CatalogSku | undefined>;
}

export interface MutableCatalogRepository extends CatalogRepository {
  updateSku(sku: string, changes: Partial<Pick<CatalogSku, "retailPrice" | "availability">>): Promise<void>;
}

/** Deterministic local adapter; replace through dependency injection in production. */
export class SeedCatalogRepository implements CatalogRepository {
  constructor(private readonly catalog: readonly CatalogSku[] = seededCatalog) {}

  async listSkus(): Promise<readonly CatalogSku[]> {
    return this.catalog;
  }

  async findSku(sku: string): Promise<CatalogSku | undefined> {
    return this.catalog.find((item) => item.sku === sku);
  }
}

/** Shared local adapter so development admin mutations are visible to storefront reads. */
export class DevelopmentCatalogRepository implements MutableCatalogRepository {
  private readonly catalog: CatalogSku[];

  constructor(source: readonly CatalogSku[] = seededCatalog) {
    this.catalog = source.map((item) => ({
      ...item,
      requirements: [...item.requirements],
      resellerPrices: { ...item.resellerPrices },
    }));
  }

  async listSkus(): Promise<readonly CatalogSku[]> {
    return this.catalog;
  }

  async findSku(sku: string): Promise<CatalogSku | undefined> {
    return this.catalog.find((item) => item.sku === sku);
  }

  async updateSku(sku: string, changes: Partial<Pick<CatalogSku, "retailPrice" | "availability">>): Promise<void> {
    const product = await this.findSku(sku);
    if (!product) throw new Error("SKU not found");
    Object.assign(product, changes);
  }
}

export const developmentCatalogRepository = new DevelopmentCatalogRepository();

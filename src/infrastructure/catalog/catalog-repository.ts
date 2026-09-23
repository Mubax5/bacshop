import type { CatalogSku } from "@/domain/catalog/types";
import { seededCatalog } from "@/infrastructure/catalog/seed-catalog";

/** Adapter seam for a future PostgreSQL catalog repository. */
export interface CatalogRepository {
  listSkus(): Promise<readonly CatalogSku[]>;
  findSku(sku: string): Promise<CatalogSku | undefined>;
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

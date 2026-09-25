import type { CatalogRepository } from "@/infrastructure/catalog/catalog-repository";
import { developmentCatalogRepository } from "@/infrastructure/catalog/catalog-repository";
import type { RetailCart, RetailCartLine } from "@/domain/retail/types";

export interface SessionCartRepository {
  get(sessionId: string): Promise<readonly { sku: string; quantity: number }[]>;
  add(sessionId: string, sku: string, quantity: number): Promise<void>;
  update(sessionId: string, sku: string, quantity: number): Promise<void>;
  remove(sessionId: string, sku: string): Promise<void>;
  clear(sessionId: string): Promise<void>;
}

/** Seed-backed process memory adapter for local development only. */
export class SeedSessionCartRepository implements SessionCartRepository {
  private readonly carts = new Map<string, Map<string, number>>();

  async get(sessionId: string) {
    return [...(this.carts.get(sessionId) ?? new Map()).entries()].map(([sku, quantity]) => ({ sku, quantity }));
  }

  async add(sessionId: string, sku: string, quantity: number) {
    const cart = this.carts.get(sessionId) ?? new Map<string, number>();
    cart.set(sku, Math.min(99, (cart.get(sku) ?? 0) + quantity));
    this.carts.set(sessionId, cart);
  }

  async update(sessionId: string, sku: string, quantity: number) {
    const cart = this.carts.get(sessionId) ?? new Map<string, number>();
    if (quantity <= 0) cart.delete(sku);
    else cart.set(sku, Math.min(99, quantity));
    this.carts.set(sessionId, cart);
  }

  async remove(sessionId: string, sku: string) {
    this.carts.get(sessionId)?.delete(sku);
  }

  async clear(sessionId: string) {
    this.carts.delete(sessionId);
  }
}

export async function reconcileRetailCart(
  repository: SessionCartRepository,
  sessionId: string,
  catalog: CatalogRepository = developmentCatalogRepository,
): Promise<RetailCart> {
  const storedLines = await repository.get(sessionId);
  const lines: RetailCartLine[] = [];
  const removedSkus: string[] = [];
  for (const stored of storedLines) {
    const sku = await catalog.findSku(stored.sku);
    if (!sku || sku.availability !== "available" || sku.stock <= 0 || !Number.isInteger(stored.quantity) || stored.quantity < 1) {
      removedSkus.push(stored.sku);
      await repository.remove(sessionId, stored.sku);
      continue;
    }
    lines.push({ sku: sku.sku, productName: sku.productName, quantity: Math.min(stored.quantity, sku.stock), retailPrice: sku.retailPrice, availability: "available" });
  }
  return { lines, subtotal: lines.reduce((sum, line) => sum + line.retailPrice * line.quantity, 0), removedSkus };
}

export const developmentSessionCart = new SeedSessionCartRepository();

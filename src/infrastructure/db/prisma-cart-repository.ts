import { createHash } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import type { SessionCartRepository } from "@/infrastructure/cart/session-cart-repository";
import { serializableTransaction } from "./transaction";

const keyFor = (sessionId: string) => {
  if (!sessionId || sessionId.length > 1024) throw new Error("Invalid cart session");
  return createHash("sha256").update(sessionId).digest("hex");
};

const validateQuantity = (quantity: number, allowZero = false) => {
  if (!Number.isSafeInteger(quantity) || quantity < (allowZero ? 0 : 1) || quantity > 99) throw new Error("Invalid cart quantity");
};

/** Session keys come from the authenticated server boundary, never a browser body. */
export class PrismaSessionCartRepository implements SessionCartRepository {
  constructor(private readonly database: PrismaClient) {}

  async get(sessionId: string) {
    const cart = await this.database.cart.findUnique({ where: { sessionKey: keyFor(sessionId) }, include: { items: { include: { sku: { select: { code: true } } } } } });
    if (!cart || cart.context !== "RETAIL" || cart.status !== "ACTIVE" || (cart.expiresAt && cart.expiresAt <= new Date())) return [];
    return cart.items.map((item) => ({ sku: item.sku.code, quantity: item.quantity }));
  }

  async add(sessionId: string, sku: string, quantity: number) {
    validateQuantity(quantity);
    await this.mutate(sessionId, sku, quantity, true);
  }

  async update(sessionId: string, sku: string, quantity: number) {
    validateQuantity(quantity, true);
    if (!quantity) return this.remove(sessionId, sku);
    await this.mutate(sessionId, sku, quantity, false);
  }

  private async mutate(sessionId: string, skuCode: string, quantity: number, increment: boolean) {
    const sessionKey = keyFor(sessionId);
    await serializableTransaction(this.database, async (transaction) => {
      const sku = await transaction.sku.findUnique({ where: { code: skuCode }, select: { id: true, isActive: true, product: { select: { isActive: true } } } });
      if (!sku?.isActive || !sku.product.isActive) throw new Error("Product is unavailable");
      const cart = await transaction.cart.upsert({ where: { sessionKey }, create: { sessionKey, context: "RETAIL", expiresAt: new Date(Date.now() + 14 * 86400000) }, update: {} });
      if (cart.status !== "ACTIVE" || cart.context !== "RETAIL" || (cart.expiresAt && cart.expiresAt <= new Date())) throw new Error("Cart session expired");
      const existing = await transaction.cartItem.findUnique({ where: { cartId_skuId: { cartId: cart.id, skuId: sku.id } } });
      const nextQuantity = increment ? quantity + (existing?.quantity ?? 0) : quantity;
      validateQuantity(nextQuantity);
      await transaction.cartItem.upsert({ where: { cartId_skuId: { cartId: cart.id, skuId: sku.id } }, create: { cartId: cart.id, skuId: sku.id, quantity: nextQuantity }, update: { quantity: nextQuantity } });
    });
  }

  async remove(sessionId: string, sku: string) {
    await this.database.cartItem.deleteMany({ where: { cart: { sessionKey: keyFor(sessionId), context: "RETAIL", status: "ACTIVE" }, sku: { code: sku } } });
  }

  async clear(sessionId: string) {
    await this.database.cartItem.deleteMany({ where: { cart: { sessionKey: keyFor(sessionId), context: "RETAIL", status: "ACTIVE" } } });
  }
}

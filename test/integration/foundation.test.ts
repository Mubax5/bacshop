import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { createDatabase } from "@/infrastructure/db/client";
import { PrismaSessionCartRepository } from "@/infrastructure/db/prisma-cart-repository";
import { PrismaWalletLedgerRepository } from "@/infrastructure/db/prisma-wallet-repository";
import { PrismaCatalogRepository } from "@/infrastructure/db/prisma-catalog-repository";
import { PrismaNotificationRepository } from "@/infrastructure/db/prisma-notification-repository";
import { PrismaAuditEventRepository } from "@/infrastructure/db/prisma-audit-repository";
import { getRetailCatalog } from "@/application/catalog/get-retail-catalog";
import { getResellerCatalog } from "@/application/reseller/get-reseller-catalog";

const connectionString = process.env.BACSHOP_INTEGRATION_DATABASE_URL;
if (!connectionString || !new URL(connectionString).pathname.endsWith("_integration")) {
  throw new Error("Set BACSHOP_INTEGRATION_DATABASE_URL to an isolated database ending in _integration");
}

const run = randomUUID();
let database: PrismaClient;
let userId: string;
let secondUserId: string;
let profileId: string;
let secondProfileId: string;
let skuId: string;
let orderId: string;
let wallet: PrismaWalletLedgerRepository;
const skuCode = `integration-${run}`;

beforeAll(async () => {
  database = createDatabase(connectionString);
  const user = await database.user.create({ data: { email: `${run}@bacshop.test`, displayName: "Integration fixture", status: "ACTIVE" } });
  const second = await database.user.create({ data: { email: `${run}-second@bacshop.test`, status: "ACTIVE" } });
  userId = user.id;
  secondUserId = second.id;
  const profile = await database.resellerProfile.create({ data: { userId, status: "APPROVED" } });
  const other = await database.resellerProfile.create({ data: { userId: secondUserId, status: "APPROVED" } });
  profileId = profile.id;
  secondProfileId = other.id;
  const product = await database.product.create({ data: { slug: skuCode, name: "Integration fixture" } });
  const sku = await database.sku.create({ data: { productId: product.id, code: skuCode, name: "Integration fixture", fulfillmentType: "activation-code", activationMethod: "activation-code", durationLabel: "30 hari", requirements: ["Email penerima"], processingSlaText: "1 hari", supportTerms: "Bantuan toko", warrantyTerms: "30 hari", region: "ID", inventory: { create: { onHand: 100, availability: "IN_STOCK" } }, prices: { create: { kind: "RETAIL", amount: 89000 } } } });
  skuId = sku.id;
  const order = await database.order.create({ data: { userId, orderNumber: `integration-${run}`, subtotalAmount: 89000, totalAmount: 89000, customerSnapshot: { email: "fixture@bacshop.test" }, items: { create: { skuId, quantity: 1, productNameSnapshot: "Integration fixture", skuNameSnapshot: "30 hari", skuCodeSnapshot: skuCode, unitPrice: 89000, lineTotal: 89000, context: "RETAIL", fulfillmentSnapshot: { sla: "1 hari" } } } } });
  orderId = order.id;
  wallet = new PrismaWalletLedgerRepository(database, { actorId: userId, reason: "Isolated integration test" });
});

afterAll(async () => { await database?.$disconnect(); });

describe("PostgreSQL production foundation", () => {
  it("persists records across independent database clients", async () => {
    const independent = createDatabase(connectionString);
    try { expect((await independent.user.findUnique({ where: { id: userId } }))?.email).toBe(`${run}@bacshop.test`); }
    finally { await independent.$disconnect(); }
  });

  it("rejects duplicate identities differing only by email case", async () => {
    await expect(database.user.create({ data: { email: `${run}@BACSHOP.TEST` } })).rejects.toThrow();
  });

  it("rejects overlapping effective prices and invalid retail tier binding", async () => {
    await expect(database.price.create({ data: { skuId, kind: "RETAIL", amount: 90000 } })).rejects.toThrow();
    await expect(database.price.create({ data: { skuId, kind: "RESELLER", amount: 70000 } })).rejects.toThrow();
  });

  it("rejects negative inventory and reservations exceeding stock", async () => {
    await expect(database.inventoryItem.update({ where: { skuId }, data: { onHand: -1 } })).rejects.toThrow();
    await expect(database.inventoryItem.update({ where: { skuId }, data: { reserved: 101 } })).rejects.toThrow();
    expect((await database.inventoryItem.findUnique({ where: { skuId } }))?.onHand).toBe(100);
  });

  it("persists carts and keeps sessions isolated without storing raw session keys", async () => {
    const cart = new PrismaSessionCartRepository(database);
    await cart.add(`session-${run}`, skuCode, 2);
    expect(await new PrismaSessionCartRepository(database).get(`session-${run}`)).toEqual([{ sku: skuCode, quantity: 2 }]);
    expect(await cart.get(`other-session-${run}`)).toEqual([]);
    expect(await database.cart.findUnique({ where: { sessionKey: `session-${run}` } })).toBeNull();
    await cart.update(`session-${run}`, skuCode, 7);
    expect(await cart.get(`session-${run}`)).toEqual([{ sku: skuCode, quantity: 7 }]);
    await cart.remove(`session-${run}`, skuCode);
    expect(await cart.get(`session-${run}`)).toEqual([]);
  });

  it("serializes concurrent cart increments without losing updates", async () => {
    const cart = new PrismaSessionCartRepository(database);
    await cart.add(`concurrent-${run}`, skuCode, 1);
    await Promise.all([1, 2, 3].map(() => cart.add(`concurrent-${run}`, skuCode, 1)));
    expect(await cart.get(`concurrent-${run}`)).toEqual([{ sku: skuCode, quantity: 4 }]);
    await expect(cart.add(`concurrent-${run}`, skuCode, 99)).rejects.toThrow("Invalid cart quantity");
  });

  it("credits duplicate concurrent ledger requests once", async () => {
    const input = { resellerId: userId, amount: 100000, reference: `opening-${run}`, kind: "credit" as const };
    const results = await Promise.all([1, 2, 3].map(() => wallet.credit(input)));
    expect(results.filter((result) => !result.duplicate)).toHaveLength(1);
    expect(await wallet.getBalance(userId)).toBe(100000);
  });

  it("prevents simultaneous debits from overspending the ledger balance", async () => {
    const results = await Promise.allSettled([1, 2].map((index) => wallet.debit({ resellerId: userId, amount: 80000, reference: `purchase-${run}-${index}`, kind: "purchase" })));
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await wallet.getBalance(userId)).toBe(20000);
  });

  it("rejects reusing a ledger reference for a different amount", async () => {
    await expect(wallet.credit({ resellerId: userId, amount: 100001, reference: `opening-${run}`, kind: "credit" })).rejects.toThrow("different mutation");
  });

  it("keeps ledgers and audit records immutable", async () => {
    const entry = (await wallet.listForReseller(userId))[0];
    await expect(database.ledgerEntry.update({ where: { id: entry.id }, data: { amount: 1 } })).rejects.toThrow();
    await expect(database.ledgerEntry.delete({ where: { id: entry.id } })).rejects.toThrow();
    const audit = await database.auditEvent.findFirstOrThrow({ where: { actorUserId: userId } });
    await expect(database.auditEvent.update({ where: { id: audit.id }, data: { action: "overwritten" } })).rejects.toThrow();
    await expect(database.auditEvent.delete({ where: { id: audit.id } })).rejects.toThrow();
    await expect(database.$executeRaw`TRUNCATE TABLE audit_events`).rejects.toThrow();
    await expect(database.$executeRaw`TRUNCATE TABLE ledger_entries`).rejects.toThrow();
  });

  it("rejects direct SQL overdraw and a ledger entry linked to another wallet owner", async () => {
    const storedWallet = await database.wallet.findUniqueOrThrow({ where: { resellerProfileId: profileId } });
    await expect(database.ledgerEntry.create({ data: { walletId: storedWallet.id, resellerProfileId: profileId, type: "PURCHASE", direction: "DEBIT", amount: 999999, reference: `direct-${run}`, reason: "Test guard" } })).rejects.toThrow();
    await expect(database.ledgerEntry.create({ data: { walletId: storedWallet.id, resellerProfileId: secondProfileId, type: "ADMIN_CREDIT", direction: "CREDIT", amount: 1, reference: `cross-owner-${run}`, reason: "Test guard" } })).rejects.toThrow();
  });

  it("rejects an order targeting another reseller's customer", async () => {
    const customer = await database.resellerCustomer.create({ data: { resellerProfileId: profileId, name: "Tenant fixture" } });
    await expect(database.order.create({ data: { userId: secondUserId, orderNumber: `cross-${run}`, context: "RESELLER", resellerProfileId: secondProfileId, resellerCustomerId: customer.id, subtotalAmount: 1, totalAmount: 1, customerSnapshot: {} } })).rejects.toThrow();
  });

  it("preserves historical commercial order snapshots", async () => {
    const item = await database.orderItem.findFirstOrThrow({ where: { orderId } });
    await expect(database.orderItem.update({ where: { id: item.id }, data: { unitPrice: 1 } })).rejects.toThrow();
    await expect(database.order.update({ where: { id: orderId }, data: { totalAmount: 1 } })).rejects.toThrow();
    await database.order.update({ where: { id: orderId }, data: { status: "PROCESSING" } });
    expect((await database.order.findUniqueOrThrow({ where: { id: orderId } })).totalAmount).toBe(89000);
  });

  it("reads durable effective catalog prices with explicit retail/reseller projections", async () => {
    const tier = await database.resellerTier.upsert({ where: { code: "gold" }, create: { code: "gold", name: "Gold" }, update: {} });
    await database.price.create({ data: { skuId, kind: "RESELLER", resellerTierId: tier.id, amount: 72000 } });
    const catalog = new PrismaCatalogRepository(database);
    const retail = await getRetailCatalog({ kind: "reseller-approved", userId, tier: "gold", surface: "retail-store" }, catalog);
    const reseller = await getResellerCatalog({ kind: "reseller-approved", userId, tier: "gold", surface: "reseller-center" }, catalog);
    expect(retail.find((item) => item.sku === skuCode)?.retailPrice).toBe(89000);
    expect(JSON.stringify(retail)).not.toMatch(/resellerPrice/i);
    expect(reseller.find((item) => item.sku === skuCode)?.resellerPrice).toBe(72000);
    expect(await new PrismaCatalogRepository(database).findSku(skuCode)).toMatchObject({ duration: "30 hari", requirements: ["Email penerima"], stock: 100, inventoryMode: "finite" });
    await expect(getResellerCatalog({ kind: "customer", userId }, catalog)).rejects.toThrow("Unauthorized");
  });

  it("deduplicates notifications concurrently and isolates identical keys by user", async () => {
    const notifications = new PrismaNotificationRepository(database);
    const input = { userId, kind: "payment" as const, title: "Pembayaran diterima", body: "Pesanan diproses.", createdAt: new Date().toISOString() };
    const results = await Promise.all([1, 2, 3].map(() => notifications.saveIfMissing(`payment-${run}`, input)));
    expect(new Set(results.map((record) => record.id)).size).toBe(1);
    const other = await notifications.saveIfMissing(`payment-${run}`, { ...input, userId: secondUserId });
    expect(other.id).not.toBe(results[0].id);
    expect((await notifications.listForUser(userId)).every((record) => record.userId === userId)).toBe(true);
    await expect(notifications.saveIfMissing(`payment-${run}`, { ...input, body: "A different event" })).rejects.toThrow("conflict");
  });

  it("persists redacted audit metadata through the domain adapter", async () => {
    const audit = new PrismaAuditEventRepository(database);
    const saved = await audit.append({ actorId: userId, action: "integration.audit", targetId: skuId, details: { entityType: "sku", reason: "Integration check", quantity: 1, password: "must-not-persist", passwordHash: "private-hash", apiKey: "private-key", diagnostic: "postgresql://private:secret@localhost/private" } });
    expect(saved.details).toMatchObject({ reason: "Integration check", quantity: 1 });
    expect(saved.details).not.toHaveProperty("password");
    expect(saved.details).not.toHaveProperty("passwordHash");
    expect(saved.details).not.toHaveProperty("apiKey");
    expect(saved.details.diagnostic).toBe("[REDACTED_DATABASE_URL]");
    expect((await new PrismaAuditEventRepository(database).listForActor(userId)).some((event) => event.id === saved.id)).toBe(true);
  });
});

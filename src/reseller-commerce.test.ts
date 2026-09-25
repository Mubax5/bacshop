import { describe, expect, it } from "vitest";
import { resolveResellerAccessContext } from "@/application/reseller/resolve-reseller-access-context";
import { getRetailCatalog } from "@/application/catalog/get-retail-catalog";
import { getResellerCatalog } from "@/application/reseller/get-reseller-catalog";
import { prepareResellerPurchase } from "@/application/reseller/prepare-reseller-purchase";
import { resellerRouteRedirect } from "@/application/reseller/require-reseller";
import { SeedResellerOrderRepository } from "@/infrastructure/reseller/reseller-order-repository";
import { SeedWalletLedgerRepository } from "@/infrastructure/reseller/wallet-ledger-repository";
import { SeedAuditEventRepository } from "@/infrastructure/audit/audit-event-repository";
import type { ResellerIdentity } from "@/domain/reseller/types";

const approved: ResellerIdentity = {
  userId: "reseller-demo-1",
  status: "approved",
  tier: "gold",
};

describe("reseller center boundaries", () => {
  it("allows only approved identities into an explicitly requested reseller-center context", () => {
    for (const status of ["pending", "rejected", "suspended"] as const) {
      expect(() => resolveResellerAccessContext({ ...approved, status }, "reseller-center")).toThrow(/unauthorized/i);
    }
    expect(() => resolveResellerAccessContext(null, "reseller-center")).toThrow(/unauthorized/i);
    expect(resolveResellerAccessContext(approved, "reseller-center")).toEqual({
      kind: "reseller-approved", userId: approved.userId, tier: "gold", surface: "reseller-center",
    });
  });

  it("keeps approved resellers in retail pricing until they explicitly switch context", async () => {
    const retail = await getRetailCatalog({ kind: "reseller-approved", userId: approved.userId, tier: "gold", surface: "retail-store" });
    const reseller = await getResellerCatalog(resolveResellerAccessContext(approved, "reseller-center"));
    expect(retail[0]).toHaveProperty("retailPrice");
    expect(retail[0]).not.toHaveProperty("resellerPrice");
    expect(reseller[0]).toHaveProperty("resellerPrice");
    expect(reseller[0]).not.toHaveProperty("retailPrice");
    expect(JSON.stringify(retail)).not.toMatch(/resellerPrice|resellerPrices/i);
    expect(JSON.stringify(reseller)).not.toMatch(/resellerPrices|gold|silver|bronze/i);
  });

  it("rejects reseller price reads outside the explicit approved reseller context", async () => {
    await expect(getResellerCatalog({ kind: "customer", userId: "customer-1" })).rejects.toThrow(/unauthorized/i);
    await expect(getResellerCatalog({ kind: "reseller-approved", userId: approved.userId, tier: "gold", surface: "retail-store" })).rejects.toThrow(/unauthorized/i);
  });

  it("recalculates purchase totals from the authorized reseller price, ignoring client price and total", async () => {
    const result = await prepareResellerPurchase({
      context: resolveResellerAccessContext(approved, "reseller-center"),
      lines: [{ sku: "STREAM-ULT-1M", quantity: 2, resellerPrice: 1, retailPrice: 999999 }],
      clientTotal: 2,
      targetCustomerId: "reseller-customer-17",
      idempotencyKey: "untrusted-client-total-test",
    });
    expect(result.status).toBe("reconciliation-required");
    expect(result.subtotal).toBe(144000);
    expect(JSON.stringify(result)).not.toMatch(/retailPrice|resellerPrices/i);
  });

  it("requires a customer identifier for buy-for-customer and preserves that target on the order", async () => {
    const context = resolveResellerAccessContext(approved, "reseller-center");
    const missing = await prepareResellerPurchase({ context, lines: [{ sku: "STREAM-ULT-1M", quantity: 1 }], clientTotal: 72000 });
    expect(missing.status).toBe("invalid-input");
    const repository = new SeedResellerOrderRepository();
    const result = await prepareResellerPurchase({ context, lines: [{ sku: "STREAM-ULT-1M", quantity: 1 }], clientTotal: 72000, targetCustomerId: "reseller-customer-17", idempotencyKey: "reseller-order-test-17", orderRepository: repository });
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.order.resellerId).toBe(approved.userId);
    expect(result.order.targetCustomerId).toBe("reseller-customer-17");
  });

  it("does not replay another reseller's idempotency key or order", async () => {
    const orders = new SeedResellerOrderRepository();
    const wallet = new SeedWalletLedgerRepository({ seedDemoBalance: false });
    await wallet.credit({ resellerId: approved.userId, amount: 100000, reference: "collision-credit-a", kind: "credit" });
    await wallet.credit({ resellerId: "reseller-demo-2", amount: 100000, reference: "collision-credit-b", kind: "credit" });
    const first = await prepareResellerPurchase({
      context: resolveResellerAccessContext(approved, "reseller-center"),
      lines: [{ sku: "STREAM-ULT-1M", quantity: 1 }], clientTotal: 72000,
      targetCustomerId: "reseller-customer-17", idempotencyKey: "shared-key", orderRepository: orders, wallet,
    });
    expect(first.status).toBe("ready");
    const second = await prepareResellerPurchase({
      context: resolveResellerAccessContext({ userId: "reseller-demo-2", status: "approved", tier: "silver" }, "reseller-center"),
      lines: [{ sku: "STREAM-ULT-1M", quantity: 1 }], clientTotal: 76000,
      targetCustomerId: "reseller-customer-21", idempotencyKey: "shared-key", orderRepository: orders, wallet,
    });
    expect(second.status).toBe("invalid-input");
  });

  it("derives wallet balance from append-only entries and idempotently accepts duplicate top-ups", async () => {
    const ledger = new SeedWalletLedgerRepository({ seedDemoBalance: false });
    const first = await ledger.credit({ resellerId: approved.userId, amount: 100000, reference: "topup-event-1", kind: "top-up" });
    const replay = await ledger.credit({ resellerId: approved.userId, amount: 100000, reference: "topup-event-1", kind: "top-up" });
    expect(first.duplicate).toBe(false);
    expect(replay.duplicate).toBe(true);
    expect(await ledger.getBalance(approved.userId)).toBe(100000);
    await expect(ledger.debit({ resellerId: approved.userId, amount: 10000, reference: "purchase-1", kind: "purchase" })).resolves.toMatchObject({ duplicate: false });
    expect(await ledger.getBalance(approved.userId)).toBe(90000);
    expect(await ledger.listForReseller(approved.userId)).toHaveLength(2);
  });

  it("records audit events for reseller purchase and balance actions", async () => {
    const audit = new SeedAuditEventRepository();
    const ledger = new SeedWalletLedgerRepository({ audit });
    await ledger.credit({ resellerId: approved.userId, amount: 50000, reference: "topup-audit-1", kind: "top-up" });
    expect(await audit.listForActor(approved.userId)).toEqual(expect.arrayContaining([
      expect.objectContaining({ action: "wallet.top-up", actorId: approved.userId }),
    ]));
  });

  it("redirects unauthorized route requests before rendering reseller data", () => {
    expect(resellerRouteRedirect(null, "/reseller/prices")).toBe("/auth/sign-in?returnTo=%2Freseller%2Fprices");
    expect(resellerRouteRedirect({ ...approved, status: "pending" }, "/reseller/prices")).toBe("/reseller/access?status=pending");
    expect(resellerRouteRedirect({ ...approved, status: "suspended" }, "/reseller/prices")).toBe("/reseller/access?status=suspended");
    expect(resellerRouteRedirect(approved, "/reseller/prices")).toBeNull();
  });
});

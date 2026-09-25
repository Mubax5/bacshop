import { describe, expect, it } from "vitest";
import { requireAdminPermission } from "@/application/admin/require-admin";
import type { AdminSession } from "@/domain/admin/types";
import { AdminOperationsStore } from "@/infrastructure/admin/admin-operations-store";
import { DevelopmentCatalogRepository } from "@/infrastructure/catalog/catalog-repository";
import { getRetailCatalog } from "@/application/catalog/get-retail-catalog";
import { AdminShell } from "@/ui/admin/admin-shell";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const operations: AdminSession = {
  userId: "admin-operations-demo",
  role: "admin",
  adminRole: "operations",
  email: "operations@bacshop.test",
  displayName: "Operations Demo",
  mfaVerified: true,
};

const finance: AdminSession = { ...operations, userId: "admin-finance-demo", adminRole: "finance" };
const content: AdminSession = { ...operations, userId: "admin-content-demo", adminRole: "content" };

describe("admin operations boundaries", () => {
  it("enforces least-privilege permissions server-side", () => {
    expect(() => requireAdminPermission(operations, "orders:write")).not.toThrow();
    expect(() => requireAdminPermission(operations, "pricing:write")).toThrow(/forbidden/i);
    expect(() => requireAdminPermission(finance, "balance:write")).not.toThrow();
    expect(() => requireAdminPermission(finance, "catalog:write")).toThrow(/forbidden/i);
  });

  it("requires a reason for sensitive catalog and balance changes and audits them", async () => {
    const store = new AdminOperationsStore(new DevelopmentCatalogRepository());
    await expect(store.updatePrice(finance, "STREAM-ULT-1M", 90000, "")).rejects.toThrow(/reason/i);
    await expect(store.adjustBalance(finance, "reseller-demo-1", 50000, "")).rejects.toThrow(/reason/i);
    await store.updatePrice(finance, "STREAM-ULT-1M", 90000, "Supplier cost update");
    await store.adjustBalance(finance, "reseller-demo-1", 50000, "Manual reconciliation");
    const events = await store.listAudit();
    expect(events.map((event) => event.action)).toEqual(expect.arrayContaining(["admin.price-update", "admin.balance-adjustment"]));
  });

  it("keeps payment and fulfillment operations distinct", async () => {
    const store = new AdminOperationsStore();
    const order = (await store.listOrders(operations))[0];
    expect(order.paymentStatus).toBe("paid");
    expect(order.fulfillmentStatus).not.toBe("fulfilled");
    await store.updateFulfillment(operations, order.id, "fulfilled", "Activation completed");
    const updated = (await store.listOrders(operations)).find((candidate) => candidate.id === order.id);
    expect(updated?.paymentStatus).toBe("paid");
    expect(updated?.fulfillmentStatus).toBe("fulfilled");
  });

  it("shares catalog mutations with storefront reads through the injected repository", async () => {
    const catalog = new DevelopmentCatalogRepository();
    const store = new AdminOperationsStore(catalog);
    await store.updatePrice(finance, "STREAM-ULT-1M", 91000, "Supplier cost update");
    await store.updateAvailability(content, "STREAM-ULT-1M", "coming-soon", "Catalog review");
    const item = (await getRetailCatalog({ kind: "guest" }, catalog)).find((candidate) => candidate.sku === "STREAM-ULT-1M");
    expect(item).toMatchObject({ retailPrice: 91000, availability: "coming-soon" });
  });

  it("rejects forged status values at the admin mutation boundary", async () => {
    const store = new AdminOperationsStore();
    await expect(store.updateAvailability(content, "STREAM-ULT-1M", "hidden" as never, "Catalog review")).rejects.toThrow(/invalid/i);
    await expect(store.updateFulfillment(operations, "order-demo-001", "paid" as never, "Fulfillment review")).rejects.toThrow(/invalid/i);
  });

  it("renders an admin shell without retail navigation", () => {
    const markup = renderToStaticMarkup(createElement(AdminShell, { current: "/admin" }, createElement("p", null, "Admin content")));
    expect(markup).toContain("Admin Center");
    expect(markup).toContain("Admin content");
    expect(markup).not.toContain("Navigasi utama");
  });
});

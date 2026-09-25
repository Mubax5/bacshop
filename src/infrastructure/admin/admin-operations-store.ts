import { seededCatalog } from "@/infrastructure/catalog/seed-catalog";
import type { CatalogSku } from "@/domain/catalog/types";
import type { AdminOrderRecord, AdminPermission, AdminPromotionRecord, AdminResellerRecord, AdminSupportRecord, AdminSession } from "@/domain/admin/types";
import { ADMIN_ROLE_PERMISSIONS } from "@/domain/admin/types";
import type { AuditEvent } from "@/domain/reseller/types";

function permission(session: AdminSession, requested: AdminPermission) {
  if (!session.mfaVerified || !ADMIN_ROLE_PERMISSIONS[session.adminRole].includes(requested)) throw new Error("Forbidden admin permission");
}

export class AdminOperationsStore {
  private catalog: CatalogSku[] = seededCatalog.map((item) => ({ ...item, resellerPrices: { ...item.resellerPrices }, requirements: [...item.requirements] }));
  private readonly orders: AdminOrderRecord[] = [
    { id: "order-demo-001", customerId: "customer-demo-1", productName: "StreamPlus Ultra", total: 89000, paymentStatus: "paid", orderStatus: "processing", fulfillmentStatus: "processing", createdAt: "2026-09-25T08:00:00.000Z" },
    { id: "order-demo-002", customerId: "customer-demo-2", productName: "GameStore Gift Card 500K", total: 515000, paymentStatus: "pending", orderStatus: "created", fulfillmentStatus: "queued", createdAt: "2026-09-25T09:00:00.000Z" },
  ];
  private readonly resellers: AdminResellerRecord[] = [
    { userId: "reseller-demo-1", email: "reseller@bacshop.test", status: "approved", tier: "gold" },
    { userId: "reseller-pending-demo", email: "pending@bacshop.test", status: "pending" },
    { userId: "reseller-suspended-demo", email: "suspended@bacshop.test", status: "suspended" },
  ];
  private readonly promotions: AdminPromotionRecord[] = [{ id: "promo-ramadan", name: "Ramadan Digital Picks", status: "draft", startsAt: "2026-10-01", endsAt: "2026-10-31" }];
  private readonly support: AdminSupportRecord[] = [{ id: "ticket-1001", customerId: "customer-demo-1", subject: "Aktivasi StreamPlus belum masuk", status: "open", priority: "high" }];
  private readonly audits: AuditEvent[] = [];

  async listProducts(session: AdminSession) { permission(session, "catalog:read"); return this.catalog.map((item) => ({ ...item, resellerPrices: { ...item.resellerPrices }, requirements: [...item.requirements] })); }
  async updatePrice(session: AdminSession, sku: string, retailPrice: number, reason: string) {
    permission(session, "pricing:write");
    if (!reason.trim()) throw new Error("A reason is required");
    if (!Number.isSafeInteger(retailPrice) || retailPrice <= 0) throw new Error("Invalid price");
    const product = this.catalog.find((item) => item.sku === sku); if (!product) throw new Error("SKU not found");
    product.retailPrice = retailPrice; await this.audit(session, "admin.price-update", sku, { retailPrice, reason });
  }
  async updateAvailability(session: AdminSession, sku: string, availability: CatalogSku["availability"], reason: string) {
    permission(session, "catalog:write"); if (!reason.trim()) throw new Error("A reason is required");
    const product = this.catalog.find((item) => item.sku === sku); if (!product) throw new Error("SKU not found");
    product.availability = availability; await this.audit(session, "admin.catalog-availability-update", sku, { availability, reason });
  }
  async listOrders(session: AdminSession) { permission(session, "orders:read"); return this.orders.map((order) => ({ ...order })); }
  async updateFulfillment(session: AdminSession, id: string, fulfillmentStatus: AdminOrderRecord["fulfillmentStatus"], reason: string) {
    permission(session, "orders:write"); if (!reason.trim()) throw new Error("A reason is required");
    const order = this.orders.find((candidate) => candidate.id === id); if (!order) throw new Error("Order not found");
    order.fulfillmentStatus = fulfillmentStatus; order.orderStatus = fulfillmentStatus === "fulfilled" ? "fulfilled" : fulfillmentStatus === "issue" ? "issue" : "processing";
    await this.audit(session, "admin.fulfillment-update", id, { fulfillmentStatus, reason });
  }
  async listResellers(session: AdminSession) { permission(session, "resellers:read"); return this.resellers.map((record) => ({ ...record })); }
  async updateReseller(session: AdminSession, userId: string, status: AdminResellerRecord["status"], tier: AdminResellerRecord["tier"], reason: string) {
    permission(session, "resellers:write"); if (!reason.trim()) throw new Error("A reason is required");
    const reseller = this.resellers.find((candidate) => candidate.userId === userId); if (!reseller) throw new Error("Reseller not found");
    reseller.status = status; reseller.tier = status === "approved" ? tier : undefined; await this.audit(session, "admin.reseller-status-update", userId, { status, reason });
  }
  async listBalance(session: AdminSession) { permission(session, "balance:read"); return [{ resellerId: "reseller-demo-1", balance: 250000 }, { resellerId: "reseller-pending-demo", balance: 0 }]; }
  async adjustBalance(session: AdminSession, resellerId: string, amount: number, reason: string) {
    permission(session, "balance:write"); if (!reason.trim()) throw new Error("A reason is required");
    if (!Number.isSafeInteger(amount) || amount === 0) throw new Error("Invalid balance adjustment");
    await this.audit(session, "admin.balance-adjustment", resellerId, { amount, reason });
  }
  async listPromotions(session: AdminSession) { permission(session, "promotions:read"); return this.promotions.map((promotion) => ({ ...promotion })); }
  async updatePromotion(session: AdminSession, id: string, status: AdminPromotionRecord["status"], reason: string) { permission(session, "promotions:write"); if (!reason.trim()) throw new Error("A reason is required"); const promotion = this.promotions.find((candidate) => candidate.id === id); if (!promotion) throw new Error("Promotion not found"); promotion.status = status; await this.audit(session, "admin.promotion-update", id, { status, reason }); }
  async listSupport(session: AdminSession) { permission(session, "support:read"); return this.support.map((ticket) => ({ ...ticket })); }
  async updateSupport(session: AdminSession, id: string, status: AdminSupportRecord["status"], reason: string) { permission(session, "support:write"); if (!reason.trim()) throw new Error("A reason is required"); const ticket = this.support.find((candidate) => candidate.id === id); if (!ticket) throw new Error("Ticket not found"); ticket.status = status; await this.audit(session, "admin.support-update", id, { status, reason }); }
  async listAudit() { return this.audits.map((event) => ({ ...event, details: { ...event.details } })); }
  private async audit(session: AdminSession, action: string, targetId: string, details: Record<string, string | number | boolean>) { this.audits.push({ id: `admin-audit-${this.audits.length + 1}`, actorId: session.userId, action, targetId, details, createdAt: new Date(0).toISOString() }); }
}

export const developmentAdminOperations = new AdminOperationsStore();

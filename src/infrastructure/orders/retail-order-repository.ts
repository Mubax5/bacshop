import type { RetailOrder } from "@/domain/retail/types";

export interface RetailOrderRepository {
  find(id: string): Promise<RetailOrder | undefined>;
  listForCustomer(userId: string): Promise<RetailOrder[]>;
  save(order: RetailOrder): Promise<void>;
  acceptPaymentEvent(eventId: string, orderId: string, nextStatus: "paid" | "failed" | "expired"): Promise<{ duplicate: boolean; order?: RetailOrder }>;
}

/** Deterministic in-memory development adapter; replace with a transactional database adapter. */
export class SeedRetailOrderRepository implements RetailOrderRepository {
  private readonly orders = new Map<string, RetailOrder>();
  private readonly paymentEvents = new Set<string>();

  async find(id: string) { return this.orders.get(id); }
  async listForCustomer(userId: string) { return [...this.orders.values()].filter((order) => order.userId === userId); }
  async save(order: RetailOrder) { this.orders.set(order.id, order); }

  async acceptPaymentEvent(eventId: string, orderId: string, nextStatus: "paid" | "failed" | "expired") {
    const order = this.orders.get(orderId);
    if (this.paymentEvents.has(eventId) || !order) return { duplicate: true, order };
    this.paymentEvents.add(eventId);
    if (order.paymentStatus !== "pending") return { duplicate: true, order };
    const next: RetailOrder = {
      ...order,
      paymentStatus: nextStatus,
      orderStatus: nextStatus === "paid" ? "processing" : nextStatus === "expired" ? "cancelled" : "created",
      fulfillmentStatus: nextStatus === "paid" ? "queued" : order.fulfillmentStatus,
      timeline: [...order.timeline, { label: nextStatus === "paid" ? "Pembayaran diterima" : nextStatus === "expired" ? "Pembayaran kedaluwarsa" : "Pembayaran gagal", state: nextStatus, occurredAt: new Date(0).toISOString() }],
    };
    this.orders.set(orderId, next);
    return { duplicate: false, order: next };
  }
}

export const developmentRetailOrders = new SeedRetailOrderRepository();

import type { ResellerCustomer, ResellerOrder } from "@/domain/reseller/types";

export interface ResellerOrderRepository {
  save(order: ResellerOrder, idempotencyKey?: string): Promise<void>;
  findByIdempotencyKey(key: string): Promise<ResellerOrder | undefined>;
  listForReseller(resellerId: string): Promise<ResellerOrder[]>;
  listCustomersForReseller(resellerId: string): Promise<ResellerCustomer[]>;
}

export class SeedResellerOrderRepository implements ResellerOrderRepository {
  private readonly orders = new Map<string, ResellerOrder>();
  private readonly keys = new Map<string, string>();
  private readonly customers: ResellerCustomer[] = [
    { id: "reseller-customer-17", resellerId: "reseller-demo-1", name: "Alya Putri", contact: "alya@example.test", productName: "StreamPlus Ultra", expiresAt: "2026-10-12", status: "expiring" },
    { id: "reseller-customer-21", resellerId: "reseller-demo-1", name: "Dimas Pratama", contact: "dimas@example.test", productName: "DesignPro Team", expiresAt: "2026-12-03", status: "active" },
  ];
  async save(order: ResellerOrder, idempotencyKey = order.id) { this.orders.set(order.id, order); this.keys.set(idempotencyKey, order.id); }
  async findByIdempotencyKey(key: string) { const id = this.keys.get(key); return id ? this.orders.get(id) : undefined; }
  async listForReseller(resellerId: string) { return [...this.orders.values()].filter((order) => order.resellerId === resellerId).map((order) => ({ ...order, lines: order.lines.map((line) => ({ ...line })) })); }
  async listCustomersForReseller(resellerId: string) { return this.customers.filter((customer) => customer.resellerId === resellerId).map((customer) => ({ ...customer })); }
}

export const developmentResellerOrders = new SeedResellerOrderRepository();

export type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "refunded";
export type OrderStatus = "created" | "processing" | "needs_customer_input" | "fulfilled" | "issue" | "cancelled";
export type FulfillmentStatus = "queued" | "processing" | "needs_customer_input" | "fulfilled" | "issue";
export type EntitlementStatus = "pending_activation" | "active" | "expiring_soon" | "expired" | "revoked" | "not_applicable";
export type RetailPaymentMethod = "bank_transfer" | "qris";

export interface RetailCartLine {
  sku: string;
  productName: string;
  quantity: number;
  retailPrice: number;
  availability: "available";
}

export interface RetailCart {
  lines: RetailCartLine[];
  subtotal: number;
  removedSkus: string[];
}

export interface RetailOrder {
  id: string;
  userId: string;
  items: RetailCartLine[];
  total: number;
  recipientEmail: string;
  paymentMethod: RetailPaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  entitlementStatus: EntitlementStatus;
  createdAt: string;
  timeline: { label: string; state: string; occurredAt: string }[];
}

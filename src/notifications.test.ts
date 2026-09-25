import { describe, expect, it } from "vitest";
import { handlePaymentCallback } from "@/application/payments/handle-payment-callback";
import { DevelopmentNotificationRepository } from "@/infrastructure/notifications/notification-repository";
import { SeedRetailOrderRepository } from "@/infrastructure/orders/retail-order-repository";
import type { PaymentCallbackVerifier } from "@/infrastructure/payments/payment-provider";

describe("transactional notifications", () => {
  it("emits payment and processing notifications once for a paid callback", async () => {
    const orders = new SeedRetailOrderRepository();
    const notifications = new DevelopmentNotificationRepository();
    await orders.save({ id: "order-1", userId: "customer-1", items: [], total: 89000, recipientEmail: "buyer@example.com", paymentMethod: "qris", paymentStatus: "pending", orderStatus: "created", fulfillmentStatus: "queued", entitlementStatus: "pending_activation", createdAt: new Date(0).toISOString(), timeline: [] });
    const verifier: PaymentCallbackVerifier = { verifyCallback: async () => ({ eventId: "event-1", orderReference: "order-1", status: "paid" }) };
    await handlePaymentCallback(new Request("http://localhost"), verifier, orders, notifications);
    await handlePaymentCallback(new Request("http://localhost"), verifier, orders, notifications);
    expect((await notifications.listForUser("customer-1")).map((item) => item.kind)).toEqual(expect.arrayContaining(["payment", "processing"]));
    expect((await notifications.listForUser("customer-1"))).toHaveLength(2);
  });
});

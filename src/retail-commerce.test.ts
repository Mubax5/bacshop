import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { validateReturnPath } from "@/application/auth/return-path";
import { customerRouteRedirect } from "@/application/auth/require-customer";
import { prepareRetailCheckout } from "@/application/checkout/prepare-retail-checkout";
import { validateCheckoutDetails } from "@/application/checkout/validate-checkout-details";
import { handlePaymentCallback } from "@/application/payments/handle-payment-callback";
import type { RetailOrder } from "@/domain/retail/types";
import { SeedSessionCartRepository, reconcileRetailCart } from "@/infrastructure/cart/session-cart-repository";
import { SeedRetailOrderRepository } from "@/infrastructure/orders/retail-order-repository";
import { DevelopmentAuthAdapter } from "@/infrastructure/auth/auth-provider";
import type { PaymentCallbackVerifier } from "@/infrastructure/payments/payment-provider";
import { OrderTimeline } from "@/ui/retail/retail-surfaces";

describe("authenticated retail commerce boundaries", () => {
  it("validates recipient, payment method, and terms before creating payment intent", () => {
    expect(validateCheckoutDetails({ recipientEmail: "buyer@example.com", paymentMethod: "qris", termsAccepted: true })).toMatchObject({ recipientEmail: "buyer@example.com", paymentMethod: "qris" });
    expect(() => validateCheckoutDetails({ recipientEmail: "buyer@example.com", paymentMethod: "qris", termsAccepted: false })).toThrow(/syarat/i);
    expect(() => validateCheckoutDetails({ recipientEmail: "not-an-email", paymentMethod: "qris", termsAccepted: true })).toThrow(/email/i);
  });
  it("removes unavailable SKUs and calculates the session cart with current retail prices", async () => {
    const cartStore = new SeedSessionCartRepository();
    await cartStore.add("cart-unavailable-1", "STREAM-ULT-1M", 2);
    await cartStore.add("cart-unavailable-1", "GAME-STORE-500K", 1);

    const cart = await reconcileRetailCart(cartStore, "cart-unavailable-1");

    expect(cart.removedSkus).toEqual(["GAME-STORE-500K"]);
    expect(cart.subtotal).toBe(178000);
    expect(cart.lines).toEqual([{ sku: "STREAM-ULT-1M", productName: "StreamPlus Ultra", quantity: 2, retailPrice: 89000, availability: "available" }]);
    expect(JSON.stringify(cart)).not.toMatch(/resellerPrice/i);
  });

  it("requires a reconciliation when the catalog retail price differs from the displayed total", async () => {
    const result = await prepareRetailCheckout({
      lines: [{ sku: "STREAM-ULT-1M", quantity: 1, retailPrice: 1, resellerPrice: 0 }],
      clientTotal: 1,
    });

    expect(result.status).toBe("reconciliation-required");
    expect(result.subtotal).toBe(89000);
    expect(JSON.stringify(result)).not.toMatch(/resellerPrice/i);
  });

  it("rejects malformed client totals rather than treating them as zero", async () => {
    const result = await prepareRetailCheckout({ lines: [{ sku: "STREAM-ULT-1M", quantity: 1 }], clientTotal: "0" });
    expect(result.status).toBe("invalid-input");
  });

  it("rejects external and protocol-relative authentication return paths", () => {
    expect(validateReturnPath("https://evil.example/account")).toBe("/account");
    expect(validateReturnPath("//evil.example/checkout")).toBe("/account");
    expect(validateReturnPath("/account/orders?tab=active")).toBe("/account/orders?tab=active");
  });

  it("redirects a Guest away from customer routes and allows a Customer session", async () => {
    const guestRedirect = customerRouteRedirect(null, "/account/orders");
    const customer = await new DevelopmentAuthAdapter().authenticate("demo@bacshop.test", "bacshop-demo");

    expect(guestRedirect).toBe("/auth/sign-in?returnTo=%2Faccount%2Forders");
    expect(customerRouteRedirect(customer, "/account/orders")).toBeNull();
  });

  it("applies a verified payment callback once and leaves fulfillment pending", async () => {
    const repository = new SeedRetailOrderRepository();
    const order: RetailOrder = {
      id: "order-callback-1", userId: "customer-demo-1",
      items: [{ sku: "STREAM-ULT-1M", productName: "StreamPlus Ultra", quantity: 1, retailPrice: 89000, availability: "available" }],
      total: 89000, recipientEmail: "buyer@example.com", paymentMethod: "qris", paymentStatus: "pending", orderStatus: "created", fulfillmentStatus: "queued", entitlementStatus: "pending_activation",
      createdAt: new Date(0).toISOString(), timeline: [{ label: "Pesanan dibuat", state: "created", occurredAt: new Date(0).toISOString() }],
    };
    await repository.save(order);
    const verifier: PaymentCallbackVerifier = { verifyCallback: async () => ({ eventId: "payment-event-1", orderReference: order.id, status: "paid" }) };
    const request = new Request("https://bacshop.local/api/payments/callback", { method: "POST" });

    const first = await handlePaymentCallback(request, verifier, repository);
    const replay = await handlePaymentCallback(request, verifier, repository);

    expect(first.accepted).toBe(true);
    expect(first.duplicate).toBe(false);
    expect(replay.duplicate).toBe(true);
    expect(first.order?.paymentStatus).toBe("paid");
    expect(first.order?.orderStatus).toBe("processing");
    expect(first.order?.fulfillmentStatus).toBe("queued");
    expect(first.order?.entitlementStatus).toBe("pending_activation");
    expect((await repository.find(order.id))?.timeline).toHaveLength(2);
  });

  it("renders payment received separately from unfinished activation", () => {
    const order: RetailOrder = {
      id: "order-timeline-1", userId: "customer-demo-1", items: [], total: 0, recipientEmail: "buyer@example.com", paymentMethod: "qris",
      paymentStatus: "paid", orderStatus: "processing", fulfillmentStatus: "processing", entitlementStatus: "pending_activation",
      createdAt: new Date(0).toISOString(), timeline: [{ label: "Pembayaran diterima", state: "paid", occurredAt: new Date(0).toISOString() }],
    };
    const markup = renderToStaticMarkup(createElement(OrderTimeline, { order }));

    expect(markup).toContain("Pembayaran Diterima");
    expect(markup).toContain("Diproses");
    expect(markup).toContain("Pembayaran sudah diterima. Aktivasi masih berjalan");
  });
});

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCustomerSession } from "@/application/auth/require-customer";
import { prepareRetailCheckout } from "@/application/checkout/prepare-retail-checkout";
import { validateCheckoutDetails } from "@/application/checkout/validate-checkout-details";
import { developmentSessionCart, reconcileRetailCart } from "@/infrastructure/cart/session-cart-repository";
import { developmentCatalogRepository } from "@/infrastructure/catalog/catalog-repository";
import { developmentRetailOrders } from "@/infrastructure/orders/retail-order-repository";
import { developmentNotifications } from "@/infrastructure/notifications/notification-repository";
import { DevelopmentPaymentProvider } from "@/infrastructure/payments/payment-provider";

export async function POST(request: Request) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.redirect(new URL(`/auth/sign-in?returnTo=${encodeURIComponent("/checkout")}`, request.url), 303);
  const form = await request.formData();
  const rawClientTotal = String(form.get("clientTotal") ?? "");
  let details;
  try {
    details = validateCheckoutDetails({ recipientEmail: String(form.get("recipientEmail") ?? ""), paymentMethod: String(form.get("paymentMethod") ?? "") as "bank_transfer" | "qris", termsAccepted: form.get("termsAccepted") === "on" });
  } catch {
    return NextResponse.redirect(new URL("/checkout?error=invalid", request.url), 303);
  }
  const clientTotal = /^(0|[1-9]\d*)$/.test(rawClientTotal) ? Number(rawClientTotal) : Number.NaN;
  const sessionId = request.headers.get("cookie")?.match(/(?:^|;\s*)bacshop-cart-session=([a-zA-Z0-9-]+)/)?.[1];
  if (!sessionId) return NextResponse.redirect(new URL("/cart", request.url), 303);
  const cart = await reconcileRetailCart(developmentSessionCart, sessionId);
  const checkout = await prepareRetailCheckout({ lines: cart.lines, clientTotal, catalog: developmentCatalogRepository });
  if (checkout.status === "invalid-input") return NextResponse.redirect(new URL("/checkout?error=invalid", request.url), 303);
  if (checkout.status === "reconciliation-required") return NextResponse.redirect(new URL("/checkout?state=reconciled", request.url), 303);

  const id = randomUUID();
  const order = {
    id,
    userId: session.userId,
    items: checkout.lines,
    total: checkout.subtotal,
    recipientEmail: details.recipientEmail,
    paymentMethod: details.paymentMethod,
    paymentStatus: "pending" as const,
    orderStatus: "created" as const,
    fulfillmentStatus: "queued" as const,
    entitlementStatus: checkout.lines.every((line) => line.sku.startsWith("GAME-")) ? "not_applicable" as const : "pending_activation" as const,
    createdAt: new Date().toISOString(),
    timeline: [{ label: "Pesanan dibuat", state: "created", occurredAt: new Date().toISOString() }],
  };
  await developmentRetailOrders.save(order);
  await developmentNotifications.saveIfMissing(`order:${id}:payment-pending`, { userId: session.userId, orderId: id, kind: "payment", title: "Bet lanjut pembayaran", body: `Pesanan ${id.slice(0, 8).toUpperCase()} menunggu pembayaran.`, createdAt: order.createdAt });
  const payment = await new DevelopmentPaymentProvider().createPaymentIntent({ orderReference: id, amount: checkout.subtotal, currency: "IDR", idempotencyKey: id });
  await developmentSessionCart.clear(sessionId);
  return NextResponse.redirect(new URL(payment.redirectUrl, request.url), 303);
}

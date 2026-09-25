import type { PaymentCallbackVerifier } from "@/infrastructure/payments/payment-provider";
import type { RetailOrderRepository } from "@/infrastructure/orders/retail-order-repository";
import type { NotificationRepository } from "@/infrastructure/notifications/notification-repository";

export async function handlePaymentCallback(
  request: Request,
  verifier: PaymentCallbackVerifier,
  orders: RetailOrderRepository,
  notifications?: NotificationRepository,
) {
  const callback = await verifier.verifyCallback(request);
  if (!callback || !callback.eventId || !callback.orderReference) return { accepted: false, duplicate: false };
  const result = await orders.acceptPaymentEvent(callback.eventId, callback.orderReference, callback.status);
  if (result.order && !result.duplicate && notifications) {
    const order = result.order;
    if (callback.status === "paid") {
      await notifications.saveIfMissing(`order:${order.id}:payment-paid`, { userId: order.userId, orderId: order.id, kind: "payment", title: "Pembayaran diterima", body: `Pembayaran untuk pesanan ${order.id.slice(0, 8).toUpperCase()} sudah diterima.`, createdAt: new Date().toISOString() });
      await notifications.saveIfMissing(`order:${order.id}:processing`, { userId: order.userId, orderId: order.id, kind: "processing", title: "Pesanan masuk antrean aktivasi", body: "Tim Bacshop sedang memproses produk sesuai SLA yang tercantum.", createdAt: new Date().toISOString() });
    } else {
      await notifications.saveIfMissing(`order:${order.id}:payment-${callback.status}`, { userId: order.userId, orderId: order.id, kind: "issue", title: callback.status === "expired" ? "Pembayaran kedaluwarsa" : "Pembayaran gagal", body: "Periksa instruksi pembayaran atau buat pesanan baru jika diperlukan.", createdAt: new Date().toISOString() });
    }
  }
  return { accepted: true, duplicate: result.duplicate, order: result.order };
}

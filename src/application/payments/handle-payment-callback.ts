import type { PaymentCallbackVerifier } from "@/infrastructure/payments/payment-provider";
import type { RetailOrderRepository } from "@/infrastructure/orders/retail-order-repository";

export async function handlePaymentCallback(
  request: Request,
  verifier: PaymentCallbackVerifier,
  orders: RetailOrderRepository,
) {
  const callback = await verifier.verifyCallback(request);
  if (!callback || !callback.eventId || !callback.orderReference) return { accepted: false, duplicate: false };
  const result = await orders.acceptPaymentEvent(callback.eventId, callback.orderReference, callback.status);
  return { accepted: true, duplicate: result.duplicate, order: result.order };
}

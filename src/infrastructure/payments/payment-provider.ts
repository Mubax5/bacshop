export interface PaymentIntentRequest {
  orderReference: string;
  amount: number;
  currency: "IDR";
  idempotencyKey: string;
}

export interface PaymentIntentResult {
  providerReference: string;
  redirectUrl: string;
}

/** Provider credentials stay inside server adapters implementing this contract. */
export interface PaymentProvider {
  createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResult>;
}

export interface VerifiedPaymentCallback {
  eventId: string;
  orderReference: string;
  status: "paid" | "failed" | "expired";
}

/** A provider adapter must verify signatures before returning a callback from this boundary. */
export interface PaymentCallbackVerifier {
  verifyCallback(request: Request): Promise<VerifiedPaymentCallback | null>;
}

export class DevelopmentPaymentProvider implements PaymentProvider {
  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResult> {
    return { providerReference: `dev-${request.idempotencyKey}`, redirectUrl: `/account/orders/${encodeURIComponent(request.orderReference)}?payment=pending` };
  }
}

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

/** Development-only callback verifier. Production adapters must verify provider signatures. */
export class DevelopmentPaymentCallbackVerifier implements PaymentCallbackVerifier {
  async verifyCallback(request: Request): Promise<VerifiedPaymentCallback | null> {
    if (request.headers.get("x-bacshop-dev-signature") !== "dev-only") return null;
    try {
      const payload = await request.json() as Partial<VerifiedPaymentCallback>;
      if (typeof payload.eventId !== "string" || typeof payload.orderReference !== "string") return null;
      if (payload.status !== "paid" && payload.status !== "failed" && payload.status !== "expired") return null;
      return { eventId: payload.eventId, orderReference: payload.orderReference, status: payload.status };
    } catch {
      return null;
    }
  }
}

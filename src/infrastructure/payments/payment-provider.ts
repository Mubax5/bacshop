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

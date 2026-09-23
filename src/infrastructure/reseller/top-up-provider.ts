export interface TopUpProvider {
  createRequest(input: { resellerId: string; amount: number; requestId: string }): Promise<{ reference: string; status: "pending" }>;
}

/** Provider seam only: initiating a top-up never credits the wallet. A verified callback must append the credit. */
export class DevelopmentTopUpProvider implements TopUpProvider {
  async createRequest(input: { resellerId: string; amount: number; requestId: string }) {
    return { reference: `dev-topup:${input.resellerId}:${input.requestId}`, status: "pending" as const };
  }
}

export const developmentTopUpProvider = new DevelopmentTopUpProvider();

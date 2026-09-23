import type { ResellerIdentity, ResellerApplicationStatus } from "@/domain/reseller/types";

export interface ResellerIdentityAdapter {
  readIdentity(sessionToken: string | undefined): Promise<ResellerIdentity | null>;
}

/** Fixed development identities only; production authentication must supply its own trusted identity adapter. */
export class DevelopmentResellerAdapter implements ResellerIdentityAdapter {
  private readonly identities: Readonly<Record<string, ResellerIdentity>> = {
    "dev-reseller-pending": { userId: "reseller-pending-demo", status: "pending" },
    "dev-reseller-approved": { userId: "reseller-demo-1", status: "approved", tier: "gold" },
    "dev-reseller-rejected": { userId: "reseller-rejected-demo", status: "rejected" },
    "dev-reseller-suspended": { userId: "reseller-suspended-demo", status: "suspended" },
  };

  async readIdentity(sessionToken: string | undefined): Promise<ResellerIdentity | null> {
    if (!sessionToken) return null;
    const identity = this.identities[sessionToken];
    return identity ? { ...identity } : null;
  }

  async setApplicationStatus(userId: string, status: ResellerApplicationStatus, tier?: ResellerIdentity["tier"]): Promise<ResellerIdentity> {
    return { userId, status, ...(status === "approved" && tier ? { tier } : {}) };
  }
}

export const developmentResellerAdapter = new DevelopmentResellerAdapter();

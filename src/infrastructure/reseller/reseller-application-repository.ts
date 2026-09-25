import type { ResellerApplicationStatus } from "@/domain/reseller/types";

export interface ResellerApplication {
  id: string;
  userId: string;
  fullName: string;
  businessName: string;
  contact: string;
  status: ResellerApplicationStatus;
  submittedAt: string;
  reviewNote?: string;
}

export interface ResellerApplicationRepository {
  findByUserId(userId: string): Promise<ResellerApplication | undefined>;
  submit(input: Omit<ResellerApplication, "id" | "status" | "submittedAt">): Promise<ResellerApplication>;
}

export class DevelopmentResellerApplicationRepository implements ResellerApplicationRepository {
  private readonly applications = new Map<string, ResellerApplication>();

  async findByUserId(userId: string) {
    return this.applications.get(userId);
  }

  async submit(input: Omit<ResellerApplication, "id" | "status" | "submittedAt">) {
    const existing = await this.findByUserId(input.userId);
    if (existing && ["pending", "approved", "suspended"].includes(existing.status)) return existing;
    const application: ResellerApplication = {
      ...input,
      id: `reseller-application-${encodeURIComponent(input.userId)}`,
      status: "pending",
      submittedAt: new Date(0).toISOString(),
    };
    this.applications.set(input.userId, application);
    return application;
  }
}

export const developmentResellerApplications = new DevelopmentResellerApplicationRepository();

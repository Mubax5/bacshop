import { describe, expect, it } from "vitest";
import { submitResellerApplication } from "@/application/reseller/submit-reseller-application";
import { DevelopmentResellerApplicationRepository } from "@/infrastructure/reseller/reseller-application-repository";

describe("reseller application lifecycle", () => {
  it("creates an idempotent pending application for a customer", async () => {
    const repository = new DevelopmentResellerApplicationRepository();
    const input = { userId: "customer-1", fullName: "Alya Putri", businessName: "Alya Digital", contact: "08123456789" };
    const first = await submitResellerApplication(input, repository);
    const second = await submitResellerApplication(input, repository);
    expect(first.status).toBe("pending");
    expect(second.id).toBe(first.id);
    expect(await repository.findByUserId("customer-1")).toMatchObject({ businessName: "Alya Digital", status: "pending" });
  });

  it("rejects incomplete application data before persistence", async () => {
    await expect(submitResellerApplication({ userId: "customer-2", fullName: "A", businessName: "", contact: "123" }, new DevelopmentResellerApplicationRepository())).rejects.toThrow(/wajib/i);
  });
});

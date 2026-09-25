import type { ResellerApplication } from "@/infrastructure/reseller/reseller-application-repository";
import { developmentResellerApplications, type ResellerApplicationRepository } from "@/infrastructure/reseller/reseller-application-repository";

export async function submitResellerApplication(
  input: Omit<ResellerApplication, "id" | "status" | "submittedAt">,
  repository: ResellerApplicationRepository = developmentResellerApplications,
) {
  if (input.fullName.trim().length < 2) throw new Error("Nama lengkap wajib diisi");
  if (input.businessName.trim().length < 2) throw new Error("Nama usaha wajib diisi");
  if (input.contact.trim().length < 6) throw new Error("Kontak wajib diisi");
  return repository.submit({ ...input, fullName: input.fullName.trim(), businessName: input.businessName.trim(), contact: input.contact.trim() });
}

import type { Metadata } from "next";
import { getCustomerSession } from "@/application/auth/require-customer";
import { developmentResellerApplications } from "@/infrastructure/reseller/reseller-application-repository";
import { ResellerProgramSurface } from "@/ui/commerce/public-pages";

export const metadata: Metadata = { title: "Program Reseller" };
export default async function ResellerProgramPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getCustomerSession();
  const application = session ? await developmentResellerApplications.findByUserId(session.userId) : undefined;
  const params = await searchParams;
  return <ResellerProgramSurface session={session ? { userId: session.userId, displayName: session.displayName, role: session.role } : undefined} application={application} error={params.error === "invalid" ? "invalid" : ""} />;
}

import { ResellerStatusPage } from "@/ui/reseller/reseller-surfaces";

export default async function ResellerAccessPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "pending" } = await searchParams;
  return <ResellerStatusPage status={status} />;
}

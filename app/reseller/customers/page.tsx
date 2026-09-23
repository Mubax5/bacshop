import { requireResellerContext } from "@/application/reseller/require-reseller";
import { developmentResellerOrders } from "@/infrastructure/reseller/reseller-order-repository";
import { ResellerAppShell, ResellerCustomersSurface } from "@/ui/reseller/reseller-surfaces";

export const dynamic = "force-dynamic";
export default async function ResellerCustomersPage() {
  const context = await requireResellerContext("/reseller/customers");
  return <ResellerAppShell current="/reseller/customers"><ResellerCustomersSurface customers={await developmentResellerOrders.listCustomersForReseller(context.userId)} /></ResellerAppShell>;
}

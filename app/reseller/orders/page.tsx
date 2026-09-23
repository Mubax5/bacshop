import { requireResellerContext } from "@/application/reseller/require-reseller";
import { developmentResellerOrders } from "@/infrastructure/reseller/reseller-order-repository";
import { ResellerAppShell, ResellerOrdersSurface } from "@/ui/reseller/reseller-surfaces";

export const dynamic = "force-dynamic";
export default async function ResellerOrdersPage() {
  const context = await requireResellerContext("/reseller/orders");
  return <ResellerAppShell current="/reseller/orders"><ResellerOrdersSurface orders={await developmentResellerOrders.listForReseller(context.userId)} /></ResellerAppShell>;
}

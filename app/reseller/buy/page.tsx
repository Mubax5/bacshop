import { requireResellerContext } from "@/application/reseller/require-reseller";
import { getResellerCatalog } from "@/application/reseller/get-reseller-catalog";
import { developmentResellerOrders } from "@/infrastructure/reseller/reseller-order-repository";
import { ResellerAppShell, ResellerCatalogSurface } from "@/ui/reseller/reseller-surfaces";

export const dynamic = "force-dynamic";
export default async function ResellerBuyPage() {
  const context = await requireResellerContext("/reseller/buy");
  const [items, customers] = await Promise.all([getResellerCatalog(context), developmentResellerOrders.listCustomersForReseller(context.userId)]);
  return <ResellerAppShell current="/reseller/buy"><ResellerCatalogSurface items={items} buy customers={customers} /></ResellerAppShell>;
}

import { requireResellerContext } from "@/application/reseller/require-reseller";
import { getResellerCatalog } from "@/application/reseller/get-reseller-catalog";
import { ResellerAppShell, ResellerCatalogSurface } from "@/ui/reseller/reseller-surfaces";

export const dynamic = "force-dynamic";
export default async function ResellerPricesPage() {
  const context = await requireResellerContext("/reseller/prices");
  return <ResellerAppShell current="/reseller/prices"><ResellerCatalogSurface items={await getResellerCatalog(context)} /></ResellerAppShell>;
}

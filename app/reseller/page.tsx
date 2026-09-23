import { requireResellerContext } from "@/application/reseller/require-reseller";
import { developmentResellerOrders } from "@/infrastructure/reseller/reseller-order-repository";
import { developmentWalletLedger } from "@/infrastructure/reseller/wallet-ledger-repository";
import { ResellerAppShell, ResellerDashboardSurface } from "@/ui/reseller/reseller-surfaces";

export const dynamic = "force-dynamic";
export default async function ResellerDashboardPage() {
  const context = await requireResellerContext("/reseller");
  const [balance, orders, customers] = await Promise.all([
    developmentWalletLedger.getBalance(context.userId),
    developmentResellerOrders.listForReseller(context.userId),
    developmentResellerOrders.listCustomersForReseller(context.userId),
  ]);
  return <ResellerAppShell current="/reseller"><ResellerDashboardSurface balance={balance} orders={orders} customers={customers} /></ResellerAppShell>;
}

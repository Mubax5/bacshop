import { requireResellerContext } from "@/application/reseller/require-reseller";
import { developmentWalletLedger } from "@/infrastructure/reseller/wallet-ledger-repository";
import { ResellerAppShell, ResellerBalanceSurface } from "@/ui/reseller/reseller-surfaces";

export const dynamic = "force-dynamic";
export default async function ResellerBalancePage({ searchParams }: { searchParams: Promise<{ topup?: string }> }) {
  const context = await requireResellerContext("/reseller/balance");
  const [balance, entries, params] = await Promise.all([
    developmentWalletLedger.getBalance(context.userId),
    developmentWalletLedger.listForReseller(context.userId),
    searchParams,
  ]);
  const notice = params.topup === "pending" ? "Permintaan top-up dibuat dan menunggu konfirmasi provider. Saldo belum berubah." : params.topup === "invalid" ? "Nominal top-up tidak valid. Gunakan Rp 10.000 sampai Rp 10.000.000." : "";
  return <ResellerAppShell current="/reseller/balance"><ResellerBalanceSurface balance={balance} entries={entries} notice={notice} /></ResellerAppShell>;
}

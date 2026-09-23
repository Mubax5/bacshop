import { redirect } from "next/navigation";
import { requireResellerContext } from "@/application/reseller/require-reseller";
import { requestWalletTopUp } from "@/application/reseller/request-wallet-top-up";

export async function POST(request: Request) {
  const context = await requireResellerContext("/reseller/balance");
  const form = await request.formData();
  let accepted = false;
  try { await requestWalletTopUp({ context, amount: Number(form.get("amount")), requestId: String(form.get("requestId") ?? "") }); accepted = true; } catch { accepted = false; }
  if (accepted) {
    redirect("/reseller/balance?topup=pending");
  } else {
    redirect("/reseller/balance?topup=invalid");
  }
}

import { validBrowserMutation } from "@/application/auth/browser-mutation";
import { getConfig } from "@/infrastructure/config/env";
import { redirect } from "next/navigation";
import { requireResellerContext } from "@/application/reseller/require-reseller";
import { requestWalletTopUp } from "@/application/reseller/request-wallet-top-up";

export async function POST(request: Request) {
  const context = await requireResellerContext("/reseller/balance");
  const form = await request.formData();
  if (!(await validBrowserMutation(request, form))) return new Response("Permintaan tidak valid. Muat ulang halaman dan coba lagi.", { status: 403 });
  if (getConfig().runtime === "database") return new Response("Top-up belum tersedia pada runtime migrasi ini.", { status: 503 });
  let accepted = false;
  try { await requestWalletTopUp({ context, amount: Number(form.get("amount")), requestId: String(form.get("requestId") ?? "") }); accepted = true; } catch { accepted = false; }
  if (accepted) {
    redirect("/reseller/balance?topup=pending");
  } else {
    redirect("/reseller/balance?topup=invalid");
  }
}

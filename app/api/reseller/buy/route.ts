import { validBrowserMutation } from "@/application/auth/browser-mutation";
import { getConfig } from "@/infrastructure/config/env";
import { redirect } from "next/navigation";
import { requireResellerContext } from "@/application/reseller/require-reseller";
import { prepareResellerPurchase } from "@/application/reseller/prepare-reseller-purchase";

export async function POST(request: Request) {
  const context = await requireResellerContext("/reseller/buy");
  const form = await request.formData();
  if (!(await validBrowserMutation(request, form))) return new Response("Permintaan tidak valid. Muat ulang halaman dan coba lagi.", { status: 403 });
  if (getConfig().runtime === "database") return new Response("Pembelian reseller belum tersedia pada runtime migrasi ini.", { status: 503 });
  const result = await prepareResellerPurchase({
    context,
    lines: [{ sku: String(form.get("sku") ?? ""), quantity: Number(form.get("quantity") ?? 1) }],
    clientTotal: Number(form.get("clientTotal")),
    targetCustomerId: String(form.get("targetCustomerId") ?? ""),
    idempotencyKey: String(form.get("idempotencyKey") ?? ""),
  });
  if (result.status === "ready") redirect(`/reseller/orders?purchase=${result.duplicate ? "duplicate" : "created"}`);
  redirect(`/reseller/buy?purchase=${result.status === "reconciliation-required" ? `review&total=${result.subtotal}` : "invalid"}`);
}

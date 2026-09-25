import type { AccessContext } from "@/domain/access/types";
import type { ResellerOrder } from "@/domain/reseller/types";
import type { CatalogRepository } from "@/infrastructure/catalog/catalog-repository";
import { developmentCatalogRepository } from "@/infrastructure/catalog/catalog-repository";
import type { ResellerOrderRepository } from "@/infrastructure/reseller/reseller-order-repository";
import { developmentResellerOrders } from "@/infrastructure/reseller/reseller-order-repository";
import type { WalletLedgerRepository } from "@/infrastructure/reseller/wallet-ledger-repository";
import { developmentWalletLedger } from "@/infrastructure/reseller/wallet-ledger-repository";
import { resolvePrice } from "@/domain/pricing/price-resolver";
import { developmentAuditEvents } from "@/infrastructure/audit/audit-event-repository";

export interface ResellerPurchaseLineInput { sku: string; quantity: number; resellerPrice?: number; retailPrice?: number }
export type ResellerPurchaseResult =
  | { status: "invalid-input"; lines: []; subtotal: 0; message: string }
  | { status: "reconciliation-required"; lines: { sku: string; productName: string; quantity: number; resellerPrice: number }[]; subtotal: number; message: string }
  | { status: "ready"; lines: ResellerOrder["lines"]; subtotal: number; order: ResellerOrder; duplicate: boolean };

export async function prepareResellerPurchase(input: {
  context: AccessContext;
  lines: unknown;
  clientTotal: unknown;
  targetCustomerId?: string;
  idempotencyKey?: string;
  catalog?: CatalogRepository;
  orderRepository?: ResellerOrderRepository;
  wallet?: WalletLedgerRepository;
}): Promise<ResellerPurchaseResult> {
  if (input.context.kind !== "reseller-approved" || input.context.surface !== "reseller-center") throw new Error("Unauthorized reseller purchase");
  const invalid = (): ResellerPurchaseResult => ({ status: "invalid-input", lines: [], subtotal: 0, message: "Periksa produk, jumlah, dan pelanggan tujuan." });
  if (!input.targetCustomerId?.trim() || !input.idempotencyKey?.trim() || !Array.isArray(input.lines) || input.lines.length === 0 ||
    !Number.isSafeInteger(input.clientTotal) || Number(input.clientTotal) < 0 || input.lines.some((line) => !line || typeof line !== "object" ||
      typeof (line as Record<string, unknown>).sku !== "string" || !Number.isSafeInteger((line as Record<string, unknown>).quantity) || Number((line as Record<string, unknown>).quantity) < 1)) return invalid();
  const orders = input.orderRepository ?? developmentResellerOrders;
  const duplicate = await orders.findByIdempotencyKey(input.idempotencyKey);
  if (duplicate) {
    if (duplicate.resellerId !== input.context.userId) return invalid();
    return { status: "ready", lines: duplicate.lines, subtotal: duplicate.total, order: duplicate, duplicate: true };
  }

  const catalog = input.catalog ?? developmentCatalogRepository;
  const seen = new Set<string>();
  const lines: ResellerOrder["lines"] = [];
  for (const candidate of input.lines as ResellerPurchaseLineInput[]) {
    if (seen.has(candidate.sku)) return invalid();
    seen.add(candidate.sku);
    const sku = await catalog.findSku(candidate.sku);
    if (!sku || sku.availability !== "available" || sku.stock < 1) return invalid();
    const quantity = Math.min(candidate.quantity, sku.stock);
    lines.push({ sku: sku.sku, productName: sku.productName, quantity, resellerPrice: resolvePrice(sku, input.context) });
  }
  const subtotal = lines.reduce((sum, line) => sum + line.resellerPrice * line.quantity, 0);
  if (subtotal !== input.clientTotal) return { status: "reconciliation-required", lines, subtotal, message: "Harga reseller atau ketersediaan berubah. Tinjau total terbaru sebelum melanjutkan." };

  const orderId = `reseller-order-${encodeURIComponent(input.idempotencyKey)}`;
  const order: ResellerOrder = {
    id: orderId,
    resellerId: input.context.userId,
    targetCustomerId: input.targetCustomerId.trim(),
    lines,
    total: subtotal,
    createdAt: new Date(0).toISOString(),
    status: "processing",
  };
  await (input.wallet ?? developmentWalletLedger).debit({ resellerId: order.resellerId, amount: subtotal, reference: `purchase:${input.idempotencyKey}`, kind: "purchase" });
  await orders.save(order, input.idempotencyKey);
  await developmentAuditEvents.append({ actorId: order.resellerId, action: "reseller.purchase-for-customer", targetId: order.id, details: { customerId: order.targetCustomerId, total: order.total } });
  return { status: "ready", lines, subtotal, order, duplicate: false };
}

import type { CatalogRepository } from "@/infrastructure/catalog/catalog-repository";
import { developmentCatalogRepository } from "@/infrastructure/catalog/catalog-repository";
import type { RetailCartLine } from "@/domain/retail/types";

export interface CheckoutLineInput {
  sku: string;
  quantity: number;
  /** Deliberately ignored if sent by an untrusted browser. */
  retailPrice?: number;
  resellerPrice?: number;
}

export type RetailCheckoutResult =
  | { status: "invalid-input"; lines: []; subtotal: 0; message: string }
  | { status: "reconciliation-required"; lines: RetailCartLine[]; subtotal: number; removedSkus: string[]; message: string }
  | { status: "ready"; lines: RetailCartLine[]; subtotal: number; removedSkus: [] };

export async function prepareRetailCheckout(input: {
  lines: unknown;
  clientTotal: unknown;
  catalog?: CatalogRepository;
}): Promise<RetailCheckoutResult> {
  const catalog = input.catalog ?? developmentCatalogRepository;
  if (!Array.isArray(input.lines) || input.lines.length === 0 ||
    !Number.isSafeInteger(input.clientTotal) || Number(input.clientTotal) < 0 ||
    input.lines.some((line) => !line || typeof line !== "object" ||
      typeof (line as Record<string, unknown>).sku !== "string" ||
      !Number.isSafeInteger((line as Record<string, unknown>).quantity) ||
      Number((line as Record<string, unknown>).quantity) < 1)) {
    return { status: "invalid-input", lines: [], subtotal: 0, message: "Periksa kembali isi keranjang dan totalnya." };
  }

  const retailLines: RetailCartLine[] = [];
  const removedSkus: string[] = [];
  const seen = new Set<string>();
  for (const candidate of input.lines as CheckoutLineInput[]) {
    if (seen.has(candidate.sku)) return { status: "invalid-input", lines: [], subtotal: 0, message: "Produk keranjang tidak valid." };
    seen.add(candidate.sku);
    const sku = await catalog.findSku(candidate.sku);
    if (!sku || sku.availability !== "available" || (sku.inventoryMode !== "unlimited" && sku.stock <= 0)) {
      removedSkus.push(candidate.sku);
      continue;
    }
    if (candidate.quantity > 99 || (sku.inventoryMode !== "unlimited" && candidate.quantity > sku.stock)) {
      return { status: "invalid-input", lines: [], subtotal: 0, message: "Jumlah yang diminta melebihi stok tersedia. Ubah jumlah di keranjang." };
    }
    const quantity = candidate.quantity;
    retailLines.push({ sku: sku.sku, productName: sku.productName, quantity, retailPrice: sku.retailPrice, availability: "available" });
  }
  const subtotal = retailLines.reduce((sum, line) => sum + line.retailPrice * line.quantity, 0);
  if (removedSkus.length || subtotal !== input.clientTotal) {
    return {
      status: "reconciliation-required",
      lines: retailLines,
      subtotal,
      removedSkus,
      message: "Harga atau ketersediaan produk berubah. Tinjau total terbaru sebelum melanjutkan.",
    };
  }
  return { status: "ready", lines: retailLines, subtotal, removedSkus: [] };
}

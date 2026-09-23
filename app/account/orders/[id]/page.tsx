import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCustomer } from "@/application/auth/require-customer";
import { developmentRetailOrders } from "@/infrastructure/orders/retail-order-repository";
import { PageHeading, PageWidth } from "@/ui/foundations/primitives";
import { OrderTimeline } from "@/ui/retail/retail-surfaces";
import { formatRetailPrice } from "@/ui/commerce/public-content";

export const metadata: Metadata = { title: "Detail Pesanan" };

export default async function CustomerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const customer = await requireCustomer("/account/orders");
  const { id } = await params;
  const order = await developmentRetailOrders.find(id);
  if (!order || order.userId !== customer.userId) notFound();
  return <main className="retail-page"><PageWidth><nav className="breadcrumbs"><Link href="/account/orders">Pesanan saya</Link><span aria-hidden="true">/</span><span>Detail</span></nav><PageHeading eyebrow="DETAIL PESANAN" title={`Pesanan ${id.slice(0, 8).toUpperCase()}`} description="Pembayaran diterima tidak berarti aktivasi telah selesai." /><section className="order-card"><h2>Produk</h2>{order.items.map((line) => <div className="retail-cart-line" key={line.sku}><div><h3>{line.productName}</h3><p>{line.quantity} × {formatRetailPrice(line.retailPrice)}</p></div><strong>{formatRetailPrice(line.retailPrice * line.quantity)}</strong></div>)}<div className="retail-summary"><span>Total retail</span><strong>{formatRetailPrice(order.total)}</strong></div></section><OrderTimeline order={order} /><section className="order-next-step"><h2>Langkah berikutnya</h2><p>{order.paymentStatus === "pending" ? "Selesaikan pembayaran melalui instruksi penyedia pembayaran." : order.fulfillmentStatus === "fulfilled" ? "Produk siap digunakan. Simpan detail aktivasi ini untuk referensi." : "Pembayaran akan diproses lebih dahulu, lalu tim Bacshop memulai aktivasi sesuai estimasi produk."}</p><Link className="button button--secondary" href={`/account/support?order=${encodeURIComponent(id)}`}>Bantuan untuk pesanan ini</Link><form action="/api/cart/items" method="post"><input type="hidden" name="sku" value={order.items[0]?.sku ?? ""} /><input type="hidden" name="quantity" value="1" /><button className="button button--primary" type="submit">Beli lagi</button></form></section></PageWidth></main>;
}

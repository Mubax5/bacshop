import type { Metadata } from "next";
import Link from "next/link";
import { requireCustomer } from "@/application/auth/require-customer";
import { developmentRetailOrders } from "@/infrastructure/orders/retail-order-repository";
import { PageHeading, PageWidth } from "@/ui/foundations/primitives";
import { OrderTimeline } from "@/ui/retail/retail-surfaces";

export const metadata: Metadata = { title: "Pesanan Saya" };

export default async function CustomerOrdersPage() {
  const customer = await requireCustomer("/account/orders");
  const orders = await developmentRetailOrders.listForCustomer(customer.userId);
  return <main className="retail-page"><PageWidth><PageHeading eyebrow="AKUN CUSTOMER" title="Pesanan saya" description="Pantau pembayaran dan aktivasi secara terpisah." />{orders.length === 0 ? <section className="retail-empty"><h2>Belum ada pesanan</h2><p>Pesanan yang kamu buat akan tampil di sini.</p><Link className="button button--primary" href="/shop">Jelajahi produk</Link></section> : <div className="order-list">{orders.map((order) => <article className="order-card" key={order.id}><header><div><span>Pesanan</span><h2><Link href={`/account/orders/${order.id}`}>{order.id.slice(0, 8).toUpperCase()}</Link></h2></div><time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleDateString("id-ID")}</time></header><p>{order.items.map((item) => item.productName).join(", ")}</p><OrderTimeline order={order} /></article>)}</div>}</PageWidth></main>;
}

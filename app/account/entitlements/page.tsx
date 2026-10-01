import { CsrfInput } from "@/ui/security/csrf-input";
import type { Metadata } from "next";
import Link from "next/link";
import { requireCustomer } from "@/application/auth/require-customer";
import { developmentRetailOrders } from "@/infrastructure/orders/retail-order-repository";
import { PageHeading, PageWidth } from "@/ui/foundations/primitives";

export const metadata: Metadata = { title: "Produk Aktif" };

export default async function EntitlementsPage() {
  const customer = await requireCustomer("/account/entitlements");
  const orders = await developmentRetailOrders.listForCustomer(customer.userId);
  const eligible = orders.filter((order) => order.entitlementStatus !== "not_applicable");
  return <main className="retail-page"><PageWidth><PageHeading eyebrow="AKUN CUSTOMER" title="Produk dan aktivasi" description="Status aktivasi, pembaruan, dan pembelian ulang produkmu." />{eligible.length === 0 ? <section className="retail-empty"><h2>Belum ada aktivasi</h2><p>Produk digital yang memiliki siklus aktivasi akan ditampilkan di sini.</p><Link className="button button--primary" href="/shop">Jelajahi produk</Link></section> : <div className="order-list">{eligible.map((order) => <article className="order-card" key={order.id}><h2>{order.items.map((item) => item.productName).join(", ")}</h2><p>Status aktivasi: {order.fulfillmentStatus === "fulfilled" ? "Aktif / Selesai" : order.fulfillmentStatus === "processing" ? "Diproses" : "Menunggu aktivasi"}</p><div className="account-actions"><Link className="button button--secondary" href={`/account/orders/${order.id}`}>Lihat pesanan</Link><form action="/api/cart/items" method="post"><CsrfInput /><input type="hidden" name="sku" value={order.items[0]?.sku ?? ""} /><input type="hidden" name="quantity" value="1" /><button className="button button--primary" type="submit">Perpanjang / beli lagi</button></form></div></article>)}</div>}</PageWidth></main>;
}

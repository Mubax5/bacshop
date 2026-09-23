import type { Metadata } from "next";
import Link from "next/link";
import { requireCustomer } from "@/application/auth/require-customer";
import { developmentRetailOrders } from "@/infrastructure/orders/retail-order-repository";
import { PageHeading, PageWidth } from "@/ui/foundations/primitives";

export const metadata: Metadata = { title: "Bantuan Customer" };

export default async function CustomerSupportPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const customer = await requireCustomer("/account/support");
  const [params, orders] = await Promise.all([searchParams, developmentRetailOrders.listForCustomer(customer.userId)]);
  const selected = params.order ? orders.find((order) => order.id === params.order) : undefined;
  return <main className="retail-page"><PageWidth><PageHeading eyebrow="BANTUAN CUSTOMER" title="Bantuan pesanan" description="Pilih pesanan agar tim bantuan menerima konteks produk dan statusnya." />{selected && <p className="retail-notice">Konteks bantuan: pesanan {selected.id.slice(0, 8).toUpperCase()} · {selected.items.map((item) => item.productName).join(", ")}</p>}<section className="support-order-list"><h2>Pilih pesanan</h2>{orders.length === 0 ? <p>Belum ada pesanan. Buka <Link href="/help">Pusat Bantuan</Link> untuk panduan umum.</p> : orders.map((order) => <Link key={order.id} href={`/account/support?order=${encodeURIComponent(order.id)}`}>{order.id.slice(0, 8).toUpperCase()} · {order.items.map((item) => item.productName).join(", ")} <span aria-hidden="true">→</span></Link>)}</section><Link className="button button--secondary" href="/help">Pusat Bantuan</Link></PageWidth></main>;
}
